import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

import { WindowService, UserService, UserAccount, LicenseService } from '../common';
import { MdSnackBar } from '@angular/material'

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: [ 'login.component.css' ],
})
export class LoginComponent implements OnInit {
  public user: UserAccount;      // 当前账号信息
  public promptChecking = false;
  public msgs: any[] = [];       // PrimeNG 显示消息用格式
  public isMaximize = false;
  constructor(private router: Router,
              private userService: UserService,
              private licenseService: LicenseService,
              private windowService: WindowService,public snackBar:MdSnackBar) { }

  ngOnInit() {
    this.user = this.userService.user || <UserAccount>{ };
  }

  login() {
    this.userService.login(this.user).then(data => {
      if (data.error) {
        //console.log(data.error);
         this.alertError('用户信息校验失败，请重输！<br>' + data.error.title);
         return;
        }
      this.promptChecking = true;
      this.checkLicense().then(() => {
        this.router.navigate(['main', {"outlets" :{'panel-top':['toolbar-program'], 'panel-left':['lua-tree'], 'panel-bottom':['terminal']}}]);
        localStorage.setItem('localLogin', 'false');
        localStorage.setItem('offLine', 'false');
      }).catch(() => {
        this.alertError('无法通过设备授权证书验证，您暂时无法登录系统。');
      });
    })/*.catch(() => {
      this.alertError('登录异常，请检查网络或联系供应商！');
    })*/.catch(data => {
      let json = data.json();
      let res = JSON.parse(JSON.stringify(json));
      if(res.error === "Incorrect account") {
        this.alertError('登录账户有误，请重新输入！');
      } else if(res.error === "Incorrect password") {
        this.alertError('登录账户的密码有误，请重新输入！');
      } else {
        this.alertError('登录异常，请检查网络或联系供应商！');
      }
    });
  }

  checkLicense() {
    if (this.licenseService.license.length > 0) {
      return Promise.resolve(true);
    } else {
      return this.licenseService.update();
    }
  }

  closeWindow() {
    this.windowService.close();
  }

  @HostListener('window:resize')
  onResize(event) {
     if ((window.innerHeight - 8 === window.screen.availHeight && window.innerWidth - 10 === window.screen.availWidth) ||
    (window.innerHeight - 8 === window.screen.height && window.innerWidth - 10=== window.screen.width)) {
      this.isMaximize = true;
    } else {
      this.isMaximize = false;
    }
  }

  onMinimizeWin() {
    this.windowService.minimize();
  }

  onMaximizeWin() {
    if (!this.isMaximize) {
      this.windowService.maximize();
      this.isMaximize = true;
    } else {
      this.windowService.unmaximize();
      this.isMaximize = false;
    }
  }

  onCloseWin() {
      this.windowService.close();
  }


  alertError(str) {
    // this.msgs = [];
    // this.msgs.push({ severity: 'error', summary: '', detail: str });
    this.snackBar.open(str,null,{duration: 500})
  }

  // 仅供调试使用
  get diagnose() {
    return JSON.stringify(this.user);
  }

}
