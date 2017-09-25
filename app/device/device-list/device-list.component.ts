import {Component, OnInit, ElementRef} from '@angular/core';
import {MdSnackBar, MdDialogRef, MdDialog} from '@angular/material'
import {RobotService} from '../../robot-service/robot.service';
import {DeviceInfo, Device} from '../device';
import {DeviceService} from '../device.service';
import {ProgramPropService} from '../../toolbar/program/program-prop.service';
import {ControlDeviceService} from "../../new-service/control-device.service";
import {LuaLpegService} from "../../new-service/lua-lpeg.service";
import {ProgramService} from '../../common/program.service';
import {UserService} from '../../common/user.service';
import {Observable} from 'rxjs';
// import {observable} from "rxjs/symbol/observable";
import {any} from "codelyzer/util/function";
import {DeviceError} from "../../new-service/device-model-interface";

@Component({
    selector: 'app-device-list',
    templateUrl: 'device-list.component.html',
    styleUrls: ['./device-list.component.css']
})
export class DeviceListComponent implements OnInit {
    private networkName = '装配间01';
    private onlineNum = 50;
    private all = 100;
    public selectedDevice: DeviceInfo;
    public refreshFlag: boolean = true;
    public newDevices = [];
    public showListFlag: boolean = true;
    public showNotice: boolean = false;
    //private allDeviceService: DeviceInfo[];
    // msgs: Message[] = [];
    constructor(private robotService: RobotService,
                public dialog: MdDialog,
                private el: ElementRef,
                private dialogRef: MdDialogRef<DeviceListComponent>,
                private controlDeviceService: ControlDeviceService,
                public luaLpegService: LuaLpegService,
                public programService: ProgramService,
                public deviceService: DeviceService,
                public snackBar: MdSnackBar,
                public user: UserService,
                private programPropService: ProgramPropService) {
        //this.allDeviceService = JSON.parse(JSON.stringify(this.deviceService.devices));
        this.refreshFlag = true;
    }

    ngOnInit() {
        this.getDevicesList();
    }

    readInfo(machines: Array<string>) {
        let list = [];
        for (let i = 0; i < machines.length; i++) {
            list.push(this.controlDeviceService.deviceInfoRead(machines[i]))
        }
        Observable.of(...list).concatAll().subscribe(info =>{
            let infoData = JSON.parse(JSON.stringify(info));
            if(infoData.device_ip) {
                let json = new DeviceInfo();
                json = infoData;
                if(this.deviceService.serials.indexOf(json.serial) === -1) {
                    this.deviceService.serials.push(json.serial);
                    localStorage.setItem('device_data', JSON.stringify({ devices: this.deviceService.serials }));
                    json.status += 1000;
                    localStorage.setItem('$device_' + json.serial, JSON.stringify(json));
                    json.status -= 1000;
                    this.deviceService.devices.unshift(json);
                } else {
                    json.status += 1000;
                    localStorage.setItem('$device_' + json.serial, JSON.stringify(json));
                    json.status -= 1000;
                    for(let i = 0; i < this.deviceService.devices.length; i++) {
                        if(json.serial === this.deviceService.devices[i].serial) {
                            this.deviceService.devices.splice(i, 1);
                            this.deviceService.devices.unshift(json);
                            break;
                        }
                        /*Observable.of(...list).concatAll().subscribe(info => {
                         let infoData = JSON.parse(JSON.stringify(info));
                         if (infoData.ip) {
                         let json = new DeviceInfo();
                         json = infoData;
                         if (this.deviceService.serials.indexOf(json.serial) === -1) {
                         this.deviceService.serials.push(json.serial);
                         localStorage.setItem('device_data', JSON.stringify({devices: this.deviceService.serials}));
                         json.status += 1000;
                         localStorage.setItem('$device_' + json.serial, JSON.stringify(json));
                         json.status -= 1000;
                         this.deviceService.devices.unshift(json);
                         } else {
                         json.status += 1000;
                         localStorage.setItem('$device_' + json.serial, JSON.stringify(json));
                         json.status -= 1000;
                         for (let i = 0; i < this.deviceService.devices.length; i++) {
                         if (json.serial === this.deviceService.devices[i].serial) {
                         this.deviceService.devices.splice(i, 1);
                         this.deviceService.devices.unshift(json);
                         break;
                         }*/
                    }
                }
                // if(this.deviceService.currentSerial && this.deviceService.currentSerial.serial === json.serial && json.controlled && json.ip === '本机ip') {
                if (this.deviceService.currentSerial && this.deviceService.currentSerial === json.serial && json.controlled) {
                    this.deviceService.device = new Device(json, this.robotService, this.luaLpegService, this.programService, this.controlDeviceService);
                }
            }
        });
        setTimeout(() => {
            this.refreshFlag = false;
        }, 5000);
    }

    public getDevicesList() {
        this.refreshFlag = true;
        this.newDevices = [];
        this.showNotice = false;
        let device = new DeviceInfo();
        this.deviceService.currentSerial = '';
        this.deviceService.devices = [];
        this.deviceService.serials = [];
        if(JSON.parse(localStorage.getItem('device_data'))) {
            this.deviceService.serials = JSON.parse(localStorage.getItem('device_data')).devices;
        }
        if (this.deviceService.device) {
            this.deviceService.currentSerial = this.deviceService.device.serial;
            this.deviceService.device = null;
        }
        for (let i = 0; i < this.deviceService.serials.length; i++) {
            device = JSON.parse(localStorage.getItem('$device_' + this.deviceService.serials[i]));
            this.deviceService.devices.push(device);
        }
        const source = this.controlDeviceService.deviceRefresh(this.user.netSaveval1, this.user.netSaveval2, this.user.netSaveval3).toPromise().then(list => {
                let machines = list as Array<string>;
                if (machines) {
                    this.readInfo(machines);
                } else {
                    let error: DeviceError;
                    error = list as DeviceError;
                    // pop snacbar
                }
            }
        );
    }

    public searchDev(content, ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.newDevices = [];
        this.showNotice = false;
        let searchName = content.value as string;
        if(!searchName.length) {
            this.showListFlag = true;
            return;
        }
        this.showListFlag = false;
        for(let i=0; i<this.deviceService.devices.length; i++) {
            let deviceName = this.deviceService.devices[i].name.substr(0,searchName.length);
            if(deviceName === searchName) {
                this.newDevices.push(this.deviceService.devices[i]);
            }
        }
        if(!this.newDevices.length) {
            this.showNotice = true;
        }
    }

    public connectDevice(device){
        if(!this.deviceService.device) {
            this.controlDeviceService.deviceControl('ws://' + device.device_ip + ':444', { ip: device.request_ip, password: '123456', username: this.user.user.account}).subscribe(data => {
                let res = JSON.parse(JSON.stringify(data));
                if (data.message) {
                    this.informationTips('状态:' + data.name + ',描述:' + data.message);
                    return;
                }
                if (res === true || !res) {
                    for (let i in this.deviceService.devices) {
                        if (this.deviceService.devices[i].serial === device.serial) {
                            this.deviceService.devices[i].controlled = true;
                            this.controlDeviceService.deviceInfoRead('ws://' + device.device_ip + ':444').subscribe(data => {
                                let detailData = JSON.parse(JSON.stringify(data));
                                this.deviceService.device = new Device(detailData, this.robotService, this.luaLpegService, this.programService, this.controlDeviceService);
                                /*this.deviceService.device = new Device(this.deviceService.devices[i], this.robotService, this.luaLpegService, this.programService, this.controlDeviceService);*/
                                //this.deviceService.devices[i].username = detailData.username;
                                //this.deviceService.devices[i].controller_ip = detailData.controller_ip;
                                this.deviceService.devices[i].username = this.deviceService.device.username;
                                this.deviceService.devices[i].controller_ip = this.deviceService.device.controller_ip;
                                this.informationTips('已成功控制设备！', 'success');
                                this.deviceService.deviceControl = true;
                                this.controlDeviceService.connection.next(true);

                                /*获取io*/
                                this.programPropService.readIoAndStatus();

                            });
                            break;
                        }
                    }
                } else {
                    this.informationTips('已控制一台设备，无法继续控制设备！');
                    //RobotService.defaultCon = null;
                }
            });
        } else {
            this.informationTips('已控制一台设备，无法继续控制设备！');
        }
    }

    public disconnectDevice() {
        if (this.deviceService.device) {
            this.controlDeviceService.deviceRelease().subscribe(data => {
                let res = JSON.parse(JSON.stringify(data));
                for (let i in this.deviceService.devices) {
                    if (this.deviceService.devices[i].serial === this.deviceService.device.serial) {
                        this.deviceService.devices[i].controlled = false;
                        this.deviceService.devices[i].controller_ip = '';
                        break;
                    }
                }
                this.deviceService.device = null;
                if (res.message) {
                    this.informationTips('状态:' + data.name + ',描述:' + data.message);
                    return;
                }
                if (res === true || !res) {
                    this.programPropService.readIo.next("释放");
                    this.programPropService.readJoint.next("");
                    this.informationTips('已断开设备连接！', 'success');
                    this.deviceService.controllerFlag = false;
                    this.deviceService.deviceControl = false;
                    this.controlDeviceService.connection.next(false);
                    //this.getDevicesList();
                    return;
                }
            });
        } else {
            this.informationTips('当前没有设备！');
        }
    }

    closeDialog(res) {
        this.dialogRef.close(res);
    }

    private selectNode: {test: boolean};

    public changeBgcolor(e, obj) {
        if (this.selectNode) {
            delete this.selectNode.test
        }
        this.selectedDevice = obj;
        obj.test = true;
        this.selectNode = obj;
    }

    public deleteLocalDevices(serials: DeviceInfo[]) {
        let dialogRef = this.dialog.open(DialogDelComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === 'allow') {
                let devices: string[];
                for (let i = 0; i < serials.length; i++) {
                    for (let j in this.deviceService.devices) {
                        if (this.deviceService.devices[j].serial === serials[i].serial) {
                            serials[i].status = this.deviceService.devices[j].status;
                            break;
                        }
                    }
                    if (serials[i].status > 500) {
                        devices = JSON.parse(localStorage.getItem('device_data')).devices;
                        if (devices.indexOf(serials[i].serial) !== -1) {
                            devices.splice(devices.indexOf(serials[i].serial), 1);
                            localStorage.removeItem('$device_' + serials[i].serial);
                            localStorage.setItem('device_data', JSON.stringify({devices: devices}));
                        }
                        for (let j = 0; j < this.deviceService.devices.length; j++) {
                            if (this.deviceService.devices[j].serial === serials[i].serial) {
                                this.deviceService.devices.splice(j, 1);
                                break;
                            }
                        }
                        this.selectedDevice = null;
                    } else {
                        this.informationTips('无法删除在线设备');
                    }
                }
            } else {
                return;
            }
        })
    }

    public requestDevice(serial: string) {
    }

    private informationTips(message: string, type?: 'success' | 'info' | 'warn' | 'error', summary?: string) {
        if (!type) { type = 'info'; };
        if (!summary) { summary = '提示'; };
        // this.msgs = [];
        // this.msgs.push({ severity: type, summary: summary, detail: message });
        this.snackBar.open(message,null,{duration: 3000})
    }
}

@Component({
    selector: 'app-device-del',
    template: `<h1 md-dialog-title>提示</h1>
<div md-dialog-content>确认在本地删除该设备信息?</div>
<div md-dialog-actions>
  <button style="margin-left:12px;" md-button (click)="dialogRef.close('cancel')">取消</button>
  <button md-button (click)="dialogRef.close('allow')">确认</button>
</div>`,
})

export class DialogDelComponent {
    constructor(public dialogRef: MdDialogRef<DialogDelComponent>) {
    }
}

// this.deviceService.devices=[
//             {
//                 serial: '112345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '1123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'q12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: 'q123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'a12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'z12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '212345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'w12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 's12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'x12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '312345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'e12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'd12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'c12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '412345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'r12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'f12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'v12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '512345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 't12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'g12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'b12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '612345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'y12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'h12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'n12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '712345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'u12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'j12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'm12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '812345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'i12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'k12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '1q12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'qa12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'az12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '2w12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'ws12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'sx12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '3e12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'ed12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'dc12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '4r12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'rf12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'fv12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: '5t12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'tg12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'gb12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'hn12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'yh12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'jm12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'uj12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'ik12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'gh12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'df12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'ef12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'as12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'fer12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             },{
//                 serial: 'asd12345',
//                 name: '12345678',
//                 group: '123456789',
//                 ip: '123456',
//                 model: '1234567',
//                 status: 1,
//                 version: '1234',
//                 controlled: false,
//                 program_name: '123',
//                 username: '12',
//                 ui_ip: '1'
//             }
//             ]
