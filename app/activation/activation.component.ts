/**
 * Created by admin on 2016/9/19.
 */
import { Component } from '@angular/core';
import { ActivationService } from './activation.service';
import { Serial } from './activation';
import { MdSnackBar,MdGridList,MdCard,MdCheckbox } from '@angular/material'

@Component({
    selector: 'app-activation',
    templateUrl: 'activation.component.html',
    styles:[`
        .table{
              border-collapse: collapse;
              width:100%;
              padding: 0.5em;
              
              text-align: center;
        }
        .td{
          border:1px solid #add6ff;
          /*border-top: 1px solid #add6ff;*/
        }
`],
})

export class ActivationComponent {
    private serials: Serial[] = [];
    private selectedDevices: string[] = [];
    private isAllSelected = false;
    private companyName: string;
    // private msgs: Message[] = [];
    private fileData: string[];
    constructor(private activationService: ActivationService,public snackBar:MdSnackBar) {
        let serial = new Serial();
        this.serials.push(serial);
    }
    private selectDevice() {
        this.selectedDevices = [];
        if (this.isAllSelected) {
            for (let i = 0; i < this.serials.length; i++) {
                if (this.serials[i].serial && this.serials[i].serial.length > 0) {
                    this.selectedDevices.push(this.serials[i].serial);
                }
            }
        }
    }
    private addEditRow() {
        let isFull = true;
        let serial = new Serial();
        if (this.serials.length === 0) {
            this.serials.push(serial);
            return;
        }
        for (let i = 0; i < this.serials.length; i++) {
            if (!this.serials[i].serial || (this.serials[i].serial && !(this.serials[i].serial.length > 0))) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            this.serials.push(serial);
        } else {
            if (this.serials[this.serials.length - 1].serial && this.serials[this.serials.length - 1].serial.length > 0) {
                this.serials.push(serial);
            }
        }
    }
    private activeDevice() {
        if (!this.companyName) {
            // this.msgs = [];
            // this.msgs.push({ severity: 'warn', summary: '提示', detail: '请输入公司名!' });

        } else if (this.selectedDevices.length < 1) {
            // this.msgs = [];
            // this.msgs.push({ severity: 'warn', summary: '提示', detail: '请选择设备!' });
            this.snackBar.open('请选择设备!',null,{duration: 500})
        } else {
            this.activationService.getApplicationDataFromPost(this.companyName, this.selectedDevices).then(serials => {
                if (serials.description) {
                    // this.msgs = [];
                    // this.msgs.push({ severity: 'error', summary: '提示', detail: serials.description });
                    this.snackBar.open(serials.description,null,{duration: 500})
                    return;
                }
                let serial = new Serial();
                this.serials = [];
                this.serials = serials;
                this.serials.push(serial);
            });
        }
    }
    private deleteDevice() {
        for (let i = 0 ; i < this.selectedDevices.length; i++) {
            for (let j = 0; j < this.serials.length; j++) {
                if (this.selectedDevices[i] === this.serials[j].serial) {
                    this.serials.splice(j, 1);
                    break;
                }
            }
        }
        if (this.selectedDevices.length > 0 ) {
            this.addEditRow();
        }
    }
    private leadingIn() {}
    private getFile(event) {
        let reader: FileReader = new FileReader();
        let serial: string;
        this.fileData = [];
        this.serials = [];
        reader.onload = () => {
            serial = reader.result;
            this.fileData = serial.split(",");
            for(let s of this.fileData) {
                if(s.length > 100) {
                    // 数据错误
                }else {
                    this.serials.push({serial: s});
                }
            }
            this.addEditRow();
        }
        reader.readAsText(event.target.files[0]);
    }
}
