import { Component, OnInit } from '@angular/core';
import { UpgradeService } from './upgrade.service';
import { LuaOtherService } from '../new-service/lua-other.service';
import { WindowService } from '../common/window.service';
import { MdSnackBar } from '@angular/material'

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css'],
})
export class UpgradeComponent implements OnInit {
  public versionLocal: string;
  public versionCloud: string;
  public downloading: boolean = true;
  public installBtn: boolean = false;
  public reDownload: boolean = false;
  public fileInstall: string;

  get dismissThisVersion() { return false; }

  set dismissThisVersion(value) {
    if (value) {
      this.upgradeService.dismissThisVersion = this.versionCloud;
    } else {
      this.upgradeService.dismissThisVersion = 'v0.0.0';
    }
  }

  constructor(public upgradeService: UpgradeService,
              public windowService: WindowService,
              public snackBar:MdSnackBar,
              public luaOtherService: LuaOtherService) {
    this.download();
  }

  download() {
    this.reDownload = false;
    this.upgradeService.download().subscribe(data => {
      let json = JSON.parse(JSON.stringify(data));
      this.downloading = false;
      if(json.name === "Error") {
        this.reDownload = true;
      } else {
        this.installBtn = true;
        this.fileInstall = json;
      }
    });
  }

  private informationTips(message: string, type?: 'success' | 'info' | 'warn' | 'error', summary?: string) {
    if (!type) { type = 'info'; };
    if (!summary) { summary = '提示'; };
    // this.msgs = [];
    // this.msgs.push({ severity: type, summary: summary, detail: message });
    this.snackBar.open(message,null,{duration: 3000})
  }

  setup() {
    this.installBtn = false;
    this.luaOtherService.exec(this.fileInstall).subscribe(data => {
      let res = JSON.parse(JSON.stringify(data));
      if(res.name === "Error") {
        this.installBtn = true;
        this.informationTips("安装出错！")
      } else {
        this.windowService.close();
      }
    });
  }

  ngOnInit() {
    this.upgradeService.getVersionLocal().then(version => {
      this.versionLocal = version;
    });
  }

}
