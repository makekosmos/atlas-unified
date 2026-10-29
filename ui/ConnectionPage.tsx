import { Scroll, Text, View, signal } from "nsh";
import type { SyncPeer, SyncSnapshot } from "./state";

const ticketVisible = signal(false);
const selectedPeer = signal<SyncPeer | null>(null);

function peerStatus(status?: string | null) {
  return status === "online" ? "В сети" : status === "offline" ? "Не в сети" : "Статус неизвестен";
}

function deviceName(peer: SyncPeer) {
  return peer.device_name?.trim() || "Устройство";
}

export function ConnectionPage(props: {
  colors: { background: string; foreground: string; muted: string; border: string; accent: string; card: string };
  version: string;
  sync?: SyncSnapshot;
  onBack(): void;
  onShowCode(): void;
  onCopy(text: string): void;
  onConnectClipboard(): void;
  onRestart(): void;
  onAccept(deviceId: string): void;
  onDecline(deviceId: string): void;
  onCancelPairing(): void;
  onDisconnect(deviceId: string): void;
}) {
  const c = () => props.colors;
  const sync = () => props.sync;
  const incoming = () => sync()?.incoming_pairing_requests[0];
  const onlineCount = () => sync()?.peers.filter((peer) => peer.status === "online").length ?? 0;
  const statusText = () => !sync() ? "Проверяем подключение…" : onlineCount() ? `В сети: ${onlineCount()}` : sync()!.running ? "Ожидает подключения устройства" : "Синхронизация остановлена";
  const statusColor = () => onlineCount() ? "#22c55e" : sync()?.running ? "#eab308" : "#ef4444";
  const button = (label: string, onPress: () => void, primary = false, destructive = false) => (
    <View onPress={onPress} role="button" class="min-h-11 items-center justify-center rounded-lg border px-4 py-2" style={{ backgroundColor: primary ? c().accent : c().card, borderColor: destructive ? "#ef4444" : primary ? c().accent : c().border }}>
      <Text class="text-[14px] font-medium" style={{ color: primary ? c().background : destructive ? "#ef4444" : c().foreground }}>{label}</Text>
    </View>
  );
  const group = (children: unknown) => <View class="mb-5 rounded-xl border px-4 py-1" style={{ backgroundColor: c().card, borderColor: c().border }}>{children as never}</View>;

  return <View class="h-full min-h-0 flex-col" style={{ backgroundColor: c().background }}>
    <View class="h-14 shrink-0 flex-row items-center gap-2 px-3">
      <View onPress={props.onBack} role="button" accessibilityLabel="Назад" class="h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: c().border, backgroundColor: c().card }}><Text class="text-[25px]" style={{ color: c().foreground }}>‹</Text></View>
      <Text class="text-[16px] font-medium" style={{ color: c().foreground }}>Подключения</Text>
    </View>
    <Scroll class="min-h-0 flex-1 px-4 pb-8">
      <Text class="mb-2 px-1 text-[13px]" style={{ color: c().muted }}>Это устройство</Text>
      {group(<View class="min-h-[62px] flex-row items-center gap-3">
        <View class="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor() }} />
        <View class="min-w-0 flex-1">
          <Text class="text-[15px]" style={{ color: c().foreground }}>{sync()?.local_device?.device_name || "Это устройство"}</Text>
          <Text class="mt-0.5 text-[12px]" style={{ color: c().muted }}>{statusText()}</Text>
        </View>
        <Text class="text-[11px]" style={{ color: c().muted }}>Atlas {props.version}</Text>
      </View>)}

      <Text class="mb-2 px-1 text-[13px]" style={{ color: c().muted }}>Устройства</Text>
      {group(sync()?.peers.length
        ? sync()!.peers.map((peer, index) => <View class={`min-h-[58px] flex-row items-center gap-3 ${index ? "border-t" : ""}`} style={{ borderColor: c().border }}>
            <View class="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: c().background }}><Text class="text-[15px]" style={{ color: c().accent }}>{(deviceName(peer)[0] ?? "У").toUpperCase()}</Text></View>
            <View class="min-w-0 flex-1"><Text numberOfLines={1} class="text-[14px]" style={{ color: c().foreground }}>{deviceName(peer)}</Text><Text class="text-[12px]" style={{ color: peer.status === "online" ? "#22c55e" : c().muted }}>{peerStatus(peer.status)}</Text></View>
            <View onPress={() => selectedPeer.set(peer)} role="button" accessibilityLabel={`Настройки устройства ${deviceName(peer)}`} class="px-2 py-2"><Text class="text-[20px]" style={{ color: c().muted }}>⋯</Text></View>
          </View>)
        : <View class="min-h-[54px] justify-center"><Text class="text-[13px]" style={{ color: c().muted }}>Другие устройства пока не подключены</Text></View>)}

      {incoming() && group(<View class="py-3">
        <Text class="mb-1 text-[15px] font-medium" style={{ color: c().foreground }}>{incoming()?.device_name?.trim() || "Новое устройство"}</Text>
        <Text class="mb-3 text-[12px]" style={{ color: c().muted }}>Запрашивает подключение к этому Atlas. После подтверждения устройства начнут синхронизироваться.</Text>
        <View class="flex-row justify-end gap-2">
          {button("Отклонить", () => props.onDecline(incoming()!.device_id))}
          {button("Подключить", () => props.onAccept(incoming()!.device_id), true)}
        </View>
      </View>)}

      <Text class="mb-2 px-1 text-[13px]" style={{ color: c().muted }}>Подключить устройство</Text>
      {group(<View class="gap-3 py-3">
        <Text class="text-[12px] leading-5" style={{ color: c().muted }}>На втором устройстве откройте его код подключения и скопируйте его. Atlas прочитает код из буфера обмена.</Text>
        {button("Вставить код из буфера", props.onConnectClipboard, true)}
        {button(ticketVisible() ? "Обновить мой код" : "Показать мой код", () => { ticketVisible.set(true); props.onShowCode(); })}
        {sync()?.own_iroh_ticket && <View class="rounded-lg border p-3" style={{ backgroundColor: c().background, borderColor: c().border }}>
          <Text class="mb-2 text-[12px] leading-5" style={{ color: c().foreground }}>{sync()?.own_iroh_ticket}</Text>
          {button("Скопировать мой код", () => props.onCopy(sync()!.own_iroh_ticket!))}
        </View>}
      </View>)}

      {sync()?.outgoing_pairing && <View class="mb-5 rounded-xl border p-4" style={{ backgroundColor: c().card, borderColor: c().border }}>
        <Text class="mb-3 text-[14px]" style={{ color: c().foreground }}>{sync()?.outgoing_pairing?.status === "pending" ? "Ожидание подтверждения…" : sync()?.outgoing_pairing?.status === "connected" ? "Подключено" : "Запрос на подключение"}</Text>
        {sync()?.outgoing_pairing?.status === "pending" && button("Отменить запрос", props.onCancelPairing)}
      </View>}

      {sync()?.error && <Text class="mb-3 px-1 text-[13px]" style={{ color: "#ef4444" }}>{sync()?.error}</Text>}
      {button("Синхронизировать сейчас", props.onRestart, true)}
    </Scroll>

    {selectedPeer() && <View class="absolute inset-0 z-40 justify-end" style={{ backgroundColor: "#00000066" }}>
      <View onPress={() => selectedPeer.set(null)} class="absolute inset-0" accessibilityLabel="Закрыть сведения об устройстве" />
      <View class="w-full rounded-t-[24px] border px-5 pt-5 pb-8" style={{ backgroundColor: c().card, borderColor: c().border }}>
        <Text class="mb-1 text-[17px] font-medium" style={{ color: c().foreground }}>{deviceName(selectedPeer()!)}</Text>
        <Text class="mb-5 text-[13px]" style={{ color: c().muted }}>{peerStatus(selectedPeer()?.status)} · {selectedPeer()?.platform || "Платформа неизвестна"}</Text>
        {button("Отключить устройство", () => { const peer = selectedPeer(); selectedPeer.set(null); if (peer) props.onDisconnect(peer.device_id); }, false, true)}
        <View class="h-2" />
        {button("Закрыть", () => selectedPeer.set(null))}
      </View>
    </View>}
  </View>;
}
