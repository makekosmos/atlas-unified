# UniFFI and JNA look up generated bindings and native callbacks by name.
-keep class com.sun.jna.** { *; }
-keepclassmembers class * extends com.sun.jna.** { public *; }
-dontwarn java.awt.**
-dontwarn com.sun.jna.**
-keep class com.longbridge.nsh.** { *; }
-keep class com.mundus.atlas.mobile.** { *; }
-keep class uniffi.** { *; }
