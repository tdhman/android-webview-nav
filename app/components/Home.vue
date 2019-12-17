<template>
    <Page @loaded="pageLoaded">
        <ActionBar>
            <Label text="Home"></Label>
        </ActionBar>

        <GridLayout columns="*" rows="auto, auto, auto, auto, *">
            <Button row="0" col="0" height="57" text="scan" class="btn btn-primary" @tap="scanQRCode" />
            <Button row="1" col="0" height="57" text="open media" class="btn btn-primary" @tap="openMedia" />
            <Button row="2" col="0" height="57" text="navigate" class="btn btn-primary" @tap="navigate" />
            <ActivityIndicator row="3" col="0" :busy="authenticating" />
            <WebView id="wv" row="4" col="0" height="100%" />
        </GridLayout>
    </Page>
</template>

<script>
    import Test from './Test';
    import * as application from 'tns-core-modules/application';
    import * as applicationUtils from 'tns-core-modules/utils/utils';
    import { isAndroid, isIOS } from 'tns-core-modules/platform';
    const BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    export default {
        data() {
            return {
                authenticating: false
            }
        },
        methods: {
            pageLoaded(args) {
                const page = args.object;
                this.webview = page.getViewById('wv');
                this.webview.src = "http://nativescript.org";
                this.authenticating = false;

                if (isAndroid) { // nativeViewProtected
                    if (android.os.Build.VERSION.SDK_INT >= 26) {
                        this.webview.nativeViewProtected.getSettings().setSafeBrowsingEnabled(false);
                    }
                    this.webview.nativeViewProtected.getSettings().setJavaScriptEnabled(true);
                    // Required to enable DOM storage
                    this.webview.nativeViewProtected.getSettings().setDomStorageEnabled(true);
                    // Enable cache files to be go back on webview state
                    this.webview.nativeViewProtected.getSettings().setAppCacheEnabled(true);
                    this.webview.nativeViewProtected.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_CACHE_ELSE_NETWORK);
                    // Disable webview zoom buttons
                    this.webview.nativeViewProtected.getSettings().setBuiltInZoomControls(false);
                    this.webview.nativeViewProtected.getSettings().setDisplayZoomControls(false);
                    // Disable multi tab in webview
                    // this.webview.nativeViewProtected.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
                    this.webview.nativeViewProtected.getSettings().setSupportMultipleWindows(true);
                }
            },
            openMedia() {
                if (isAndroid) {
                    this.authenticating = true;
                    new Promise((resolve, reject) => {
                        let downloadData = null;
                        try {
                            // download media
                            let url = new java.net.URL("https://archive.org/download/SampleVideo1280x7205mb/SampleVideo_1280x720_5mb.mp4");
                            let httpConnection = url.openConnection();
                            httpConnection.setUseCaches(false);
                            httpConnection.setInstanceFollowRedirects(true);
                            httpConnection.setRequestMethod('GET');
                            httpConnection.setDoInput(true);

                            let responseCode = httpConnection.getResponseCode();
                            let responseInput = null;
                            if (responseCode >= 200 && responseCode < 300) responseInput = httpConnection.getInputStream();
                            else responseInput = httpConnection.getErrorStream();
                            
                            if (!responseInput) downloadData = new java.lang.Byte(0);
                            else {
                                let os = new java.io.ByteArrayOutputStream();
                                let buffer = Array.create('byte', 1024);
                                let bytesRead;
                                while ((bytesRead = responseInput.read(buffer, 0, 1024)) != -1) {
                                    os.write(buffer, 0, bytesRead);
                                }
                                os.flush();
                                os.close();
                                downloadData = os.toByteArray();
                            }
                        } catch (e) {
                            // handle exception
                            console.log('Error download', e);
                            reject(e);
                        }

                        if (downloadData) {
                            // write file to temp
                            let context = application.android.context || applicationUtils.ad.getApplicationContext();
                            let outFile = java.io.File.createTempFile('sample-test', ".mp4", context.getCacheDir());
                            if (outFile.exists()) outFile.delete();
                            let fos = new java.io.FileOutputStream(outFile.getPath());
                            fos.write(downloadData);
                            fos.close();
                            // prepare to open file
                            let uri = androidx.core.content.FileProvider.getUriForFile(context, 'org.nativescript.androidnav.fileprovider', outFile); // Here add ".provider" after your app package name
                            console.log("AppVue_openPreview: Android file uri: "+uri);

                            // get mime type
                            let mimeMap = android.webkit.MimeTypeMap.getSingleton();
                            let mime = mimeMap.getMimeTypeFromExtension("mp4");
                            // open native intent
                            var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                            intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            intent.setDataAndType(uri, mime);
                            application.android.context.startActivity(intent);
                        }
                        this.authenticating = false;
                        resolve();
                    }).catch(error => console.log(error));
                }
            },
            scanQRCode() {
                this.authenticating = true;
                let barcodescanner = new BarcodeScanner();
                barcodescanner.scan({
                    formats: "QR_CODE",   // Pass in of you want to restrict scanning to certain types
                    cancelLabel: "Done", // iOS only, default 'Close'
                    cancelLabelBackgroundColor: "#00559A", // iOS only, default '#000000' (black)
                    message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
                    showTorchButton: true,        // default false
                    closeCallback: function () { console.log("Scanner closed"); }, // invoked when the scanner was closed (success or abort)
                    resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
                    orientation: "portrait",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
                    openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
                }).then(
                    (result) => {
                        // parse QR code
                        console.log(result);
                        timeout(3000).then(() => {
                            this.authenticating = false;
                            this.$navigateTo(Test, {
                                // clearHistory: true,
                                props: {
                                    any: {}
                                }
                            });
                        });
                    },
                    (error) => {
                        console.log("No scan: " + error);
                        this.authenticating = false;
                    }
                );
            },
            navigate() {
                console.log("navigating.....");
                this.authenticating = false;
                this.$navigateTo(Test);
            }
        }
    };
</script>

<style scoped lang="scss">
    @import '~@nativescript/theme/scss/variables/blue';
</style>
