# Build a Standalone APK in a single Docker build.
# Usage:
#   docker build -t mobile-apk .
#   container=$(docker create mobile-apk)
#   docker cp "$container":/app/artifacts/app-debug.apk ./app-standalone.apk
#   docker rm "$container"

FROM node:18-bullseye AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/usr/local/android-sdk \
    ANDROID_SDK_ROOT=/usr/local/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=$PATH:/usr/local/android-sdk/cmdline-tools/latest/bin:/usr/local/android-sdk/platform-tools

# Install JDK + Android SDK command line tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jdk wget unzip python3 ca-certificates && \
    mkdir -p /usr/local/android-sdk/cmdline-tools && \
    cd /usr/local/android-sdk && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip -q cmdline-tools.zip -d /usr/local/android-sdk/cmdline-tools && \
    mv /usr/local/android-sdk/cmdline-tools/cmdline-tools /usr/local/android-sdk/cmdline-tools/latest && \
    rm cmdline-tools.zip && \
    yes | sdkmanager --licenses > /dev/null && \
    sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0" > /dev/null

WORKDIR /app

# Install JS deps
COPY package.json package-lock.json ./
RUN npm ci

RUN npm install --save-dev babel-plugin-module-resolver

# Copy the rest of the project
COPY . .

ENV EXPO_NO_TELEMETRY=1 \
    CI=1

# 1. Generate the Android folders (Prebuild)
RUN npx expo prebuild --platform android --non-interactive --clean

RUN echo "const { getDefaultConfig } = require('expo/metro-config'); module.exports = getDefaultConfig(__dirname);" > metro.config.js

# This ensures that imports like "@/components/HapticTab" resolve to "./components/HapticTab"
RUN echo "module.exports = function(api) { \
  api.cache(true); \
  return { \
    presets: ['babel-preset-expo'], \
    plugins: [ \
      ['module-resolver', { \
        alias: { \
          '@': './' \
        } \
      }] \
    ] \
  }; \
};" > babel.config.js

# 2. Create a synthetic entry file for Expo Router
RUN echo "import 'expo-router/entry';" > index.js

# 3. Manually bundle the JavaScript code using the synthetic index.js
RUN mkdir -p android/app/src/main/assets && \
    npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res/


# 4. Build the APK using Gradle
WORKDIR /app/android
RUN ./gradlew assembleDebug

# Export artifact
FROM busybox:1.36
WORKDIR /app/artifacts
COPY --from=builder /app/android/app/build/outputs/apk/debug/app-debug.apk .