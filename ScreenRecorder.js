const RECORDER_STATUS = {
    UNAVAILABLE: 0,
    CHECKING_VIDEO_DEVICE: 1,
    CHECKING_AUDIO_DEVICE: 2,
    PREPARED: 3,
    RECORDING: 4,
    PAUSED: 5,
    STOPPED: 6
}

class ScreenRecorder {
    constructor() {
        this.initAttrs();
        this.getStream();
        this.addListeners();
    }

    initAttrs() {
        this.__attrOne = document.querySelector('#startOrStop');
        this.__attrTwo = document.querySelector('#pauseOrResume');
        this.__attrThree = document.querySelector('#save');
        this.__attrFour = document.querySelector('#infoWindow');
        this.recordState = RECORDER_STATUS.UNAVAILABLE;
    }

    getStream() {
        this.recordState = RECORDER_STATUS.CHECKING_VIDEO_DEVICE;
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'screen',
                    minWidth: 1366,
                    maxWidth: 3000,
                    minHeight: 768,
                    maxHeight: 2000
                }
            }
        }).then(stream => {
            this.recordState = RECORDER_STATUS.CHECKING_AUDIO_DEVICE;
            this._stream = stream;
            return navigator.mediaDevices.getUserMedia({
                audio: true
            });
        }).then(audioStream => {
            this.recordState = RECORDER_STATUS.PREPARED;
            this._stream.addTrack(audioStream.getTracks()[0]);
        }).catch(error => {
            this.recordState = RECORDER_STATUS.UNAVAILABLE;
            console.error(error);
        })
    }

    addListeners() {
        this.startOrStop.onclick = () => {
            switch (this.recordState) {
                case RECORDER_STATUS.PREPARED:
                case RECORDER_STATUS.STOPPED:
                    this._recorder = new MediaRecorder(this._stream, {
                        mimeType: "video/webm;codecs=vp9",
                        audioBitsPerSecond: 128000,
                        videoBitsPerSecond: 2500000
                    });
                    this._chunks = [];
                    this._recorder.start();
                    this.recordState = RECORDER_STATUS.RECORDING;
                    this._recorder.ondataavailable = e => {
                        this._chunks.push(e.data);
                    }
                    break;
                case RECORDER_STATUS.PAUSED:
                case RECORDER_STATUS.RECORDING:
                    this._recorder.stop();
                    this.recordState = RECORDER_STATUS.STOPPED;
                    break;
            }
        }

        this.pauseOrResume.onclick = () => {
            switch (this.recordState) {
                case RECORDER_STATUS.PAUSED:
                    this._recorder.resume();
                    this.recordState = RECORDER_STATUS.RECORDING;
                    break;
                case RECORDER_STATUS.RECORDING:
                    this._recorder.pause();
                    this.recordState = RECORDER_STATUS.PAUSED;
                    break;
            }
        }

        this.save.onclick = () => {
            this._blob = new Blob(this._chunks, {
                type: "video/webm"
            });
            let url = window.URL.createObjectURL(this._blob);
            let a = document.createElement("a");
            a.href = url, a.download = new Date().toLocaleDateString() + ".webm";
            a.click();
            a = null;
        }
    }

    get startOrStop() {
        return this.__attrOne;
    }
    set startOrStop(value) {
        this.__attrOne.innerHTML = value;
    }

    get pauseOrResume() {
        return this.__attrTwo;
    }
    set pauseOrResume(value) {
        this.__attrTwo.innerHTML = value;
    }

    get save() {
        return this.__attrThree;
    }

    get infoWindow() {
        return this.__attrFour;
    }
    set infoWindow(value) {
        this.__attrFour.innerHTML = value;
    }

    get recordState() {
        return this._recordState;
    }
    set recordState(value) {
        switch (value) {
            case RECORDER_STATUS.UNAVAILABLE:
                if (this.recordState === RECORDER_STATUS.CHECKING_VIDEO_DEVICE) {
                    this.infoWindow = "视频设备初始化失败!";
                } else if (this.recordState === RECORDER_STATUS.CHECKING_AUDIO_DEVICE) {
                    this.infoWindow = "音频设备初始化失败!";
                }
                this.startOrStop.disabled = true;
                this.pauseOrResume.disabled = true;
                this.save.disabled = true;
                break;
            case RECORDER_STATUS.CHECKING_VIDEO_DEVICE:
                this.infoWindow = "正在初始化视频设备...";
                break;
            case RECORDER_STATUS.CHECKING_AUDIO_DEVICE:
                this.infoWindow = "正在初始化音频设备...";
                break;
            case RECORDER_STATUS.PREPARED:
                this.infoWindow = "准备就绪";
                this.startOrStop.disabled = false;
                break;
            case RECORDER_STATUS.RECORDING:
                this.infoWindow = "正在录制...";
                this.startOrStop = "停止";
                this.pauseOrResume.disabled = false;
                this.save.disabled = true;
                this.pauseOrResume = "暂停";
                break;
            case RECORDER_STATUS.PAUSED:
                this.infoWindow = "已暂停";
                this.pauseOrResume = "继续";
                break;
            case RECORDER_STATUS.STOPPED:
                this.infoWindow = "录制完成";
                this.save.disabled = false;
                this.pauseOrResume.disabled = true;
                this.startOrStop = "开始";
                break;
        }
        this._recordState = value;
    }
}

module.exports = ScreenRecorder;