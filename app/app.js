import Vue from "nativescript-vue";
import * as application from '@nativescript/core/application';
import {isAndroid} from '@nativescript/core/platform';

import Home from "./components/Home";

if (isAndroid) {
    application.android.on(application.AndroidApplication.activityCreatedEvent, (args) => {
        let policy = new android.os.StrictMode.ThreadPolicy.Builder().permitAll().build()
        android.os.StrictMode.setThreadPolicy(policy)
    });
}

new Vue({

    template: `
        <Frame>
            <Home />
        </Frame>`,

    components: {
        Home
    }
}).$start();
