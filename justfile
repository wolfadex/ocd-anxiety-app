dev:
    vite --host

build:
    vite build

sync: gen-assets build
    npx cap sync

gen-assets:
    capacitor-assets generate

open-android:
    npx cap open android

open-ios:
    npx cap open ios

run-android:
    npx cap run android

run-ios:
    npx cap run ios
