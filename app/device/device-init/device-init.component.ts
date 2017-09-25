import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RobotService } from '../../robot-service/robot.service';
import {ControlDeviceService} from "../../new-service/control-device.service";

import { MdSnackBar, MdDialogRef } from '@angular/material'
import { DeviceService } from '../device.service';

const INITMAXTIMES = 60; // 获取初始化信息的最大次数6
const INITINTERVAL = 1000; // 获取初始化信息的间隔5s
@Component({
    selector: 'app-device-init',
    templateUrl: 'device-init.component.html',
    styleUrls: ['./device-init.component.css']
})
export class DeviceInitComponent implements OnInit {
    public method = 0;
    public manualParameter = { x: 0, y: 0, z: 0, r: 0 };
    private initTimes =1;
    // msgs: Message[];
    @Output() closeInitDialog: EventEmitter<any> = new EventEmitter();

    constructor(private robotservice: RobotService,
                public deviceService: DeviceService,
                private   dialogRef: MdDialogRef<DeviceInitComponent>,
                public snackBar:MdSnackBar,
                private controlDeviceService: ControlDeviceService) {
        this.deviceService.device.clearInitData();
    }
    ngOnInit() {}

    private deviceInitHasComplete() {
        this.closeInitDialog.emit();
    }

  closeDialog(res){
    this.dialogRef.close(res);
  }

    public deviceInit() {
        if(!this.deviceService.device.isIniting) {
            this.deviceService.device.initDevice({mode: this.method,joint_1: true,joint_2: true,joint_3: true,joint_4: true}).then(data => {
              this.informationTips(data.description,data.type);
            });
        } else {
            this.informationTips('正在初始化中···','warn');
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
