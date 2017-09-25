import { Component, OnInit, Input, ViewEncapsulation, Output } from '@angular/core';
import { RobotService } from '../robot-service/robot.service';
import { DeviceInfo,Device } from './device';
import { ProgramPropService } from '../toolbar/program/program-prop.service';

import { MdSnackBar } from '@angular/material';
import { LuaLpegService } from "../new-service/lua-lpeg.service";
import { ProgramService } from '../common/program.service';

import {MdIconRegistry, MdDialog, MdDialogRef, MdDialogConfig} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';

import { DeviceService } from './device.service';

import {ControlDeviceService} from "../new-service/control-device.service";
import { Observable } from 'rxjs';

import {DeviceError} from "../new-service/device-model-interface";

@Component({
    selector: 'app-device',
    templateUrl: 'device.component.html',
    styleUrls: [('./device.component.css')],
    encapsulation: ViewEncapsulation.None,
})
export class DeviceComponent implements OnInit {

    private deviceListDisplay = false;
    private deviceInitDisplay = false;
    private isSaveInitContent = false;
    private timeOutSpeed = null;
    public speed: number = 0.5;
    // msgs: Message[] = [];

    private config = new MdDialogConfig();

    constructor(private robotService: RobotService,
                private iconRegistry: MdIconRegistry,
                private sanitizer: DomSanitizer,
                public dialog: MdDialog,
                public dialogRef: MdDialogRef<DeviceComponent>,
                private controlDeviceService: ControlDeviceService,
                public luaLpegService: LuaLpegService,
                public programService: ProgramService,
                private programPropService:ProgramPropService,
                public deviceService: DeviceService,
                public snackBar:MdSnackBar) {
      iconRegistry.addSvgIcon(
          'ic-list',
          sanitizer.bypassSecurityTrustResourceUrl('assets/icon/ic_list.svg'));
      iconRegistry.addSvgIcon(
          'ic-more',
          sanitizer.bypassSecurityTrustResourceUrl('assets/icon/ic_more.svg'));
      this.config.disableClose = true;
    }

    ngOnInit() {
        if (!localStorage.getItem('device_data')) {
            localStorage.setItem('device_data', JSON.stringify({ devices: [] }));
        }
    }




  private openInitWindow() {
    //this.deviceInitDisplay =
    let deviceInit = this.dialog.open(DialogDeviceInit, this.config);
  }

    // 控制设备运行
    public setDevicePower(power) {
      if (power && this.deviceService.device) {
          if (!this.deviceService.device.runDisabled && !this.deviceService.device.isRunning) {
            let deviceRun = this.dialog.open(DialogDeviceRun, this.config);
          } else {
              this.informationTips('确认设备是否初始化或者是否正在运行？');
          }
        }
        if (!power && this.deviceService.device) {
            if (!this.deviceService.device.stopDisabled && !this.deviceService.device.isStopping) {
                this.deviceService.device.stopDevice().then(data => {
                    if (data.name) {
                      this.informationTips('状态:' + data.name + ',描述:设备停止错误！');
                    }
                });
            } else {
                //this.informationTips('确认设备是否初始化？');
                return;
            }
        }
    }

    public setDeviceSpeed() {
        /*if (this.deviceService.device && this.deviceService.device.speedDisabled) {*/
        if (this.deviceService.device) {
            clearTimeout(this.timeOutSpeed);
            /*this.timeOutSpeed = setTimeout(() => {
                this.deviceService.device.setSpeedDevice(this.speed).subscribe(data => {
                    if (data.error) {
                      //this.informationTips('状态:' + data.error.status + ',描述:' + data.error.description, 'error', '速度调节错误！');
                      this.robotService.message.emit(data.error);
                    }
                });
            }, 1000);*/
            this.timeOutSpeed = setTimeout(() => {
                this.controlDeviceService.deviceVelocityConfig({'velocity': this.speed}).subscribe(data => {
                    let res = JSON.parse(JSON.stringify(data));
                    if(res === true) {
                        this.informationTips('速度调节成功！');
                    } else {
                        this.informationTips('速度调节错误！');
                    }
                });
            }, 1000);
        }
    }

  readInfo(machines :Array<string>) {
    let list =[];
    for(let i = 0; i< machines.length; i++) {
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
          }
        }
        // if(this.deviceService.currentSerial && this.deviceService.currentSerial.serial === json.serial && json.controlled && json.ip === '本机ip') {
        if(this.deviceService.currentSerial && this.deviceService.currentSerial === json.serial && json.controlled) {
          this.deviceService.device = new Device(json, this.robotService, this.luaLpegService, this.programService, this.controlDeviceService);
        }
      }
    });
  }


  private getDevicesList(){
    let device = new DeviceInfo();
    this.deviceService.currentSerial = '';
    this.deviceService.devices = [];
    this.deviceService.serials = [];
    this.deviceService.serials = JSON.parse(localStorage.getItem('device_data')).devices;
    if(this.deviceService.device) {
      this.deviceService.currentSerial = this.deviceService.device.serial
      this.deviceService.device = null;
    }
    for (let i = 0; i < this.deviceService.serials.length; i++) {
      device = JSON.parse(localStorage.getItem('$device_' + this.deviceService.serials[i]));
      this.deviceService.devices.push(device);
    }
    const source = this.controlDeviceService.deviceRefresh(0, 0, 0).toPromise().then(list=>{
      let machines = list as Array<string>;
      if (machines) {
        this.readInfo(machines);
      }else {
        let error : DeviceError;
        error = list as DeviceError;
        // pop snacbar
      }}
    );
  }
    closeIt(){
      this.dialogRef.close();
    }

  public devicePowerOff() {
      this.controlDeviceService.devicePowerOff().subscribe(data => {
          let res = JSON.parse(JSON.stringify(data));
          if(res === true) {
              this.informationTips("设备已关机！");
              this.deviceService.device = null;
          } else {
              this.informationTips("设备关机出错！");
          }
      });
  }

  public disconnectDevice(){
    if(this.deviceService.device) {
      this.controlDeviceService.deviceRelease().subscribe(data => {
        let res = JSON.parse(JSON.stringify(data));
        for(let i in this.deviceService.devices) {
          if(this.deviceService.devices[i].serial === this.deviceService.device.serial) {
            this.deviceService.devices[i].controlled = false;
            this.deviceService.devices[i].controller_ip = '';
            break;
          }
        }
        this.deviceService.device = null;
        if(res.message) {
          this.informationTips('状态:' + data.name + ',描述:'+ data.message);
          return;
        }
        if(res === true || !res) {
            this.programPropService.readIo.next("释放");
            this.programPropService.readJoint.next("");
            this.deviceService.controllerFlag = false;
            this.deviceService.deviceControl = false;
          this.informationTips('已断开设备连接！','success');
          this.controlDeviceService.connection.next(false);
          //this.getDevicesList();
          return;
        }
      });
    } else {
      this.informationTips('当前没有设备！');
    }
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
    selector: 'dialog-device-list',
    template: `<app-device-list></app-device-list>`,
})
export class DialogDeviceList {
    constructor(public dialogRef: MdDialogRef<DialogDeviceList>) {}
}

@Component({
  selector: 'dialog-device-init',
  template: `<app-device-init></app-device-init>`,
})
export class DialogDeviceInit {
  constructor(public dialogRef: MdDialogRef<DialogDeviceInit>) {

  }
}

@Component({
  selector: 'dialog-device-run',
  template: `<div style="position: relative;"><h1 md-dialog-title>确认</h1>
<h3 style="position: absolute; right: 0; top: -13px; cursor: pointer;">
    <md-icon (click)="closeDialog(true);">clear</md-icon>
  </h3>
<div md-dialog-content>
<h3>确认运行设备:{{this.deviceService.device.name}}?</h3>
<h4 *ngIf="noticeFlag">{{noticeText1}}</h4>
<md-radio-group class="example-radio-group" [(ngModel)]="this.deviceService.device.program_name">
  <md-radio-button class="example-radio-button"  *ngFor="let program of this.deviceService.sortPrograms" [value]="program">
    {{program}}
  </md-radio-button><br>
</md-radio-group>
<h3 class="example-selected-value">当前选中程序: {{this.deviceService.device.program_name}}</h3>
</div>
<div md-dialog-actions>
<button md-button (click)="programList();" [disabled]="!noticeFlag">{{noticeText2}}</button>
<button md-button (click)="sort('asc');">升序</button>
<button md-button (click)="sort('des');">降序</button>
  <button md-button (click)="closeDialog('cancel')">否</button>
  <button md-button (click)="closeDialog('allow')" [disabled]="!this.deviceService.device.program_name">是</button>
</div></div>`,
})
export class DialogDeviceRun {
    private noticeText1;
    public noticeText2 = "刷新中…";
    public noticeFlag: boolean = false;
  constructor(public dialogRef: MdDialogRef<DialogDeviceRun>,
              public snackBar: MdSnackBar,
              public controlDeviceService: ControlDeviceService,
              public deviceService: DeviceService) {

      this.programList();

  }

    sort(test) {
      if(test === 'asc') {
          this.deviceService.sortPrograms.sort();
      } else {
         this.deviceService.sortPrograms.sort().reverse();
      }
    }

  programList() {
      this.noticeFlag = false;
      this.noticeText2 = "刷新中…";
      this.controlDeviceService.deviceScriptQuery().subscribe(data => {
          let res = JSON.parse(JSON.stringify(data));
          if(res instanceof Array) {
              if(res.length) {
                  //this.deviceService.programs = res;
                  this.deviceService.sortPrograms = [];
                  for(let i = 0; i < res.length; i++) {
                      this.deviceService.sortPrograms.push(res[i].name);
                  }
                  this.deviceService.sortPrograms.sort();
                  //this.noticeFlag = false;
              } else {
                  //this.noticeFlag = true;
                  this.noticeText1 = "当前设备未安装程序，运行前请安装程序！";
              }
          } else {
              //this.noticeFlag = false;
              this.noticeText1 = "程序文件读取失败，请重新读取！";
          }
          this.noticeFlag = true;
          this.noticeText2 = "刷新";
      });
  }

    closeDialog(res){
        if(res === 'cancel') {
            this.dialogRef.close(true);
        } else if(res === 'allow') {
            if(this.deviceService.device.program_name) {
                this.dialogRef.close(true);
                this.deviceService.device.runDevice().subscribe(json => {
                    this.deviceService.device.isRunning = false;
                    let jsonData = JSON.parse(JSON.stringify(json));
                    if (jsonData.message) {
                        this.informationTips('状态:' + jsonData.name + ',描述:设备运行错误！');
                    } else {
                        // this.deviceService.device.status = 2;
                        // this.deviceService.device.statusSetting(this.deviceService.device.status);
                        this.deviceService.device.runStatus().subscribe(data => {
                            let res = JSON.parse(JSON.stringify(data));
                            console.log(res);
                            if(res instanceof Array) {
                                if(res[0].data.description) {
                                    this.informationTips('level:' + res[0].data.level + ',描述：' + res[0].data.description);
                                    // this.deviceService.device.status = 1;
                                    // this.deviceService.device.statusSetting(this.deviceService.device.status);
                                }
                            }
                        });
                    }
                });
            } else {
                this.informationTips("请选择运行程序！");
            }
        } else {
            this.dialogRef.close(true);
        }
    }

    /*closeDialog(res){
        if(res === 'cancel') {
            this.dialogRef.close(true);
        } else if(res === 'allow') {
            if(this.deviceService.device.program_name) {
                this.deviceService.device.runDevice().subscribe(data => {
                    console.log(data);
                    if (data.message) {
                        this.informationTips('状态:' + data.name + ',描述:设备运行错误！');
                    } else if(data.description) {
                        this.informationTips('level:' + data.level + ',描述：' + data.description);
                    } else {
                        this.informationTips("设备正在运行！");
                    }
                    this.dialogRef.close(true);
                });
            } else {
                this.informationTips("请选择运行程序！");
            }
        } else {
            this.dialogRef.close(true);
        }
    }*/

    private informationTips(message: string, type?: 'success' | 'info' | 'warn' | 'error', summary?: string) {
        if (!type) { type = 'info'; };
        if (!summary) { summary = '提示'; };
        // this.msgs = [];
        // this.msgs.push({ severity: type, summary: summary, detail: message });
        this.snackBar.open(message,null,{duration: 3000})
    }

}

