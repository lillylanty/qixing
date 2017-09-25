import { Injectable, EventEmitter } from '@angular/core';
import { DeviceInfo, Device } from './device';
import { ControlDeviceService } from '../new-service/control-device.service';

export interface pName {
    name: string;
}

@Injectable()
export class DeviceService {
    devices: DeviceInfo[]= [];
    serials: string[];
    currentSerial: string= '';
    device: Device = null;
    readJointPosition: EventEmitter<any> = new EventEmitter<any>();
    //public programs: Array<pName> = [];
    public sortPrograms: Array<any> = [];
    public report_info: Array<any> = [];
    public deviceControl: boolean = false;
    public controllerFlag: boolean = false;
    constructor() {

    }
}
