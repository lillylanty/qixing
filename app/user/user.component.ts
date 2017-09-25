import { Component,EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { UserService, UserAccount } from '../common/user.service';
import { MdSnackBar,MdDialog,MdDialogRef,MdList,MdListItem,MdButton } from '@angular/material'
import { shortcutComponent } from '../structure/user-setting/shortcut.component';
// import { LicenseService } from '../common/license.service';

import { RobotService } from '../robot-service/robot.service';
import { UpgradeService } from '../upgrade/upgrade.service';
import { LuaOtherService } from '../new-service/lua-other.service';

declare let electron: any;

@Component({
  selector: 'app-user',
  templateUrl: 'user.component.html',
  styleUrls: [ 'user.component.css' ],
})

export class UserComponent implements OnInit  {
  // public msgs: any[] = [];          // PrimeNG 显示消息用格式
  public type:string;
  public ipSave: boolean = true;

  get user() {
    return this.userService.user;
  }
//private qxmodel:qxmodelService,

  public updateVer: boolean = false;
  public path = electron.remote.getGlobal("dirname");

  constructor(private userService: UserService,
              private router: Router,
              public upgradeService: UpgradeService,
              private robotService: RobotService,
              public luaOtherService: LuaOtherService,
              public snackBar:MdSnackBar,
              public dialogRef: MdDialogRef<UserComponent>,

  ) { }

  ngOnInit() {
    if(this.type === 'version') {
      this.upgradeService.checkNewVersion().then(data => {
        if(data) {
          this.updateVer = true;
          let myNotification = new Notification('新版本通知', {
            body: '检测到新版本，是否升级？',
            icon: this.path + '/dist/favicon.ico',
          });

          myNotification.onclick = () => {
            this.versionRuq(true);
          }
        }
      });
    }
  }

  versionRuq(res) {
    if(res) {
      this.upgradeService.download().subscribe(data => {
        let json = JSON.parse(JSON.stringify(data));
        if(json.name === 'Error') {
          //this.informationTips("下载出错!");
          let myNotification = new Notification('通知', {
            body: '下载出错!',
            icon: this.path + '/dist/favicon.ico',
            // requireInteraction: true,
          });
        } else {
          this.installFile = json;
          let myNotification = new Notification('通知', {
            body: '新版本下载完成，是否重启安装？',
            icon: this.path + '/dist/favicon.ico',
            // requireInteraction: true,
          });
          myNotification.onclick = () => {
            this.verStep(true);
          }
        }
      });
    }
  }

  public installFile: any;

  verStep(res) {
    if(res) {
      this.luaOtherService.exec(this.installFile).subscribe(data => {
        let json = JSON.parse(JSON.stringify(data));
        if(json.name === 'Error') {
          //this.informationTips("安装出错!");
          let myNotification = new Notification('通知', {
            body: '安装出错!',
            icon: this.path + '/dist/favicon.ico',
            // requireInteraction: true,
          });
        } else {
          localStorage.removeItem("imgCode");
          localStorage.removeItem("imgId");
          localStorage.removeItem("newSlides");
          localStorage.setItem("skip", "false");
        }
      });
    }
  }

  login() {
    this.userService.login();

  }

  ipModifySave(num){
    this.ipSave = false;
  }

  logout() {
    this.userService.logout();
    this.robotService.release({ password: '123456' });
    this.router.navigate(['login']);
  }

  closeDialog(res) {
    if(res) {
      this.userService.netSaveval1 = this.userService.netval1;
      this.userService.netSaveval2 = this.userService.netval2;
      this.userService.netSaveval3 = this.userService.netval3;
    } else {
      this.userService.netval1 = this.userService.netSaveval1;
      this.userService.netval2 = this.userService.netSaveval2;
      this.userService.netval3 = this.userService.netSaveval3;
    }
    this.dialogRef.close(res);
  }

  alertError(str) {
    // this.msgs = [];
    // this.msgs.push({ severity: 'error', summary: '', detail: str });
    this.snackBar.open(str,null,{duration:500})
  }


}
