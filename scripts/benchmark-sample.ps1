[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$ErrorActionPreference = 'SilentlyContinue'
# The host prepends `$atlasPid = <pid>;`; a bare run samples this shell instead.
if ($null -eq $atlasPid) { $atlasPid = $PID }
$watch = [Diagnostics.Stopwatch]::StartNew()
$samples = @()
$processIoSamples = @()
$systemSamples = @()
# One tick of the hardware is 6 ms (a 165 Hz panel): the process counters are
# cheap enough to read every 100 ms, so a 320 ms stage still gets three of
# them, and its memory peak is not lost between two frames.
$processIntervalMs = 100
$processIoIntervalMs = 1000
# PerfProc and the GPU/disk counters are CIM queries: a few hundred
# milliseconds each, so these two probes are run-level measurements (three or
# four of them per benchmark), never per-stage ones.
$systemIntervalMs = 3000

$ioProbe = [PowerShell]::Create()
$null = $ioProbe.AddScript({
    param($targetPid)
    $ErrorActionPreference = 'SilentlyContinue'
    $perf = Get-CimInstance Win32_PerfFormattedData_PerfProc_Process -Filter "IDProcess=$targetPid" -OperationTimeoutSec 2
    [ordered]@{
        at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        readBytesPerSecond = $perf.IOReadBytesPersec
        writeBytesPerSecond = $perf.IOWriteBytesPersec
        otherBytesPerSecond = $perf.IOOtherBytesPersec
    }
}).AddArgument($atlasPid)

$systemProbe = [PowerShell]::Create()
$null = $systemProbe.AddScript({
    param($targetPid)
    $ErrorActionPreference = 'SilentlyContinue'
    $gpu = @(Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -OperationTimeoutSec 2)
    $atlasGpu = @($gpu | Where-Object Name -Like "pid_${targetPid}_*")
    $vram = @(Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUProcessMemory -OperationTimeoutSec 2 |
        Where-Object Name -Like "pid_${targetPid}_*")
    $disk = Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk -Filter "Name='_Total'" -OperationTimeoutSec 2
    $cpu = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'" -OperationTimeoutSec 2
    $memory = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory -OperationTimeoutSec 2
    [ordered]@{
        at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        systemCpuPercent = $cpu.PercentProcessorTime
        systemFreeRamBytes = $memory.AvailableBytes
        diskReadBytesPerSecond = $disk.DiskReadBytesPersec
        diskWriteBytesPerSecond = $disk.DiskWriteBytesPersec
        diskBusyPercent = $disk.PercentDiskTime
        gpuCountersAvailable = $gpu.Count -gt 0
        gpuEngines = @($atlasGpu | ForEach-Object {
            [ordered]@{ name = $_.Name; utilizationPercent = $_.UtilizationPercentage }
        })
        gpuMemory = @($vram | ForEach-Object {
            [ordered]@{ name = $_.Name; dedicatedBytes = $_.DedicatedUsage; sharedBytes = $_.SharedUsage }
        })
    }
}).AddArgument($atlasPid)

$previousCpu = $null
$previousMs = 0
$logical = [Environment]::ProcessorCount
$ioPending = $null
$ioNextStartMs = 0
$systemPending = $null
$systemNextStartMs = 0
do {
    $process = Get-Process -Id $atlasPid
    if (!$process) { break }
    $nowMs = $watch.Elapsed.TotalMilliseconds
    # An `if` without an `else` yields AutomationNull, which ConvertTo-Json
    # writes as `{}`: the first sample's unknown CPU is a plain `$null`.
    $cpuPercent = $null
    if ($null -ne $previousCpu) {
        $cpuPercent = 100000 * ($process.CPU - $previousCpu) / (($nowMs - $previousMs) * $logical)
    }
    $previousCpu = $process.CPU
    $previousMs = $nowMs
    $samples += [ordered]@{
        at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        cpuPercentOfMachine = $cpuPercent
        residentBytes = $process.WorkingSet64
        privateBytes = $process.PrivateMemorySize64
        threadCount = $process.Threads.Count
        handleCount = $process.HandleCount
    }
    if ($samples.Count -eq 1) { [Console]::WriteLine('ready') }

    if ($null -ne $ioPending) {
        if ($ioPending.IsCompleted) {
            $processIoSamples += @($ioProbe.EndInvoke($ioPending))
            $ioPending = $null
        }
    }
    if ($null -eq $ioPending -and $nowMs -ge $ioNextStartMs) {
        $ioPending = $ioProbe.BeginInvoke()
        $ioNextStartMs = $nowMs + $processIoIntervalMs
    }

    if ($null -ne $systemPending) {
        if ($systemPending.IsCompleted) {
            $systemSamples += @($systemProbe.EndInvoke($systemPending))
            $systemPending = $null
        }
    }
    if ($null -eq $systemPending -and $nowMs -ge $systemNextStartMs) {
        $systemPending = $systemProbe.BeginInvoke()
        $systemNextStartMs = $nowMs + $systemIntervalMs
    }

    Start-Sleep -Milliseconds $processIntervalMs
} while ($watch.Elapsed.TotalSeconds -lt 12)
if ($null -ne $ioPending -and $ioPending.IsCompleted) {
    $processIoSamples += @($ioProbe.EndInvoke($ioPending))
} else {
    $ioProbe.Stop()
}
if ($null -ne $systemPending -and $systemPending.IsCompleted) {
    $systemSamples += @($systemProbe.EndInvoke($systemPending))
} else {
    $systemProbe.Stop()
}
$ioProbe.Dispose()
$systemProbe.Dispose()
[ordered]@{
    cpu = @(Get-CimInstance Win32_Processor -OperationTimeoutSec 2 | Select-Object -ExpandProperty Name)
    logicalProcessors = $logical
    gpu = @(Get-CimInstance Win32_VideoController -OperationTimeoutSec 2 | Select-Object -ExpandProperty Name)
    systemRamBytes = (Get-CimInstance Win32_ComputerSystem -OperationTimeoutSec 2).TotalPhysicalMemory
    fixedDisks = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' -OperationTimeoutSec 2 |
        Select-Object DeviceID, Size, FreeSpace)
    osVersion = [Environment]::OSVersion.VersionString
    cadenceMilliseconds = [ordered]@{
        process = $processIntervalMs
        processIo = $processIoIntervalMs
        system = $systemIntervalMs
    }
    samples = $samples
    processIoSamples = $processIoSamples
    systemSamples = $systemSamples
} | ConvertTo-Json -Depth 6 -Compress
