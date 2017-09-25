import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { WindowService } from '../common/window.service';
import {environment} from "../../environments/environment";
import { LuaOtherService } from '../new-service/lua-other.service';
import {Observable} from "rxjs";

interface UpgradeStorage {
  dismissThisVersion: string;
  downloading: string;
  downloaded: string;
}

interface PackageInfo {
  version: string;    // '1.0.0'
  version_code: number;
  platform: string;   // 'windows' | 'android' | 'pad' | 'ios'
  size: number;       // unit: MB
  level: number;      // 0 - optional 1 - mandatory
  url: string;        // package downloading url
  description: string;
  md5: string;
}

@Injectable()
export class UpgradeService {
  public versionLocal: string;
  public versionCloud: string;
  public packageInfo = <PackageInfo>{};
  public promptWindow = false;
  private url:any = environment;
  private verUrl: string = this.url.UpdateServer + this.url.Prefix + '/versions/windows';
  private _versionCheckPromise: Promise<boolean>;
  private upgradeStorage: UpgradeStorage;

  //public closeWin: boolean = true;

  get dismissThisVersion() {
    return this.upgradeStorage.dismissThisVersion;
  }

  set dismissThisVersion(value) {
    this.upgradeStorage.dismissThisVersion = value;
    this.saveUpgradeStorage();
  }

  get downloading() {
    return this.upgradeStorage.downloading;
  }

  set downloading(value) {
    this.upgradeStorage.downloading = value;
    this.saveUpgradeStorage();
  }

  get downloaded() {
    return this.upgradeStorage.downloaded;
  }

  set downloaded(value) {
    this.upgradeStorage.downloaded = value;
    this.saveUpgradeStorage();
  }

  constructor(public http: Http,
              public luaOtherService: LuaOtherService) {
    this.upgradeStorage = JSON.parse(localStorage.getItem('upgrade-data')) || { };
    this.checkNewVersion().then(value => {
      if (value && this.versionCloud !== this.dismissThisVersion) {
        this.promptWindow = true;
      }
    });
  }

  /** 获取当前版本号 */
  getVersionLocal() {
    return Promise.resolve(this.versionLocal);
  }

  /** 获取云端最新版本号 */
  getVersionCloud() {
    return this.versionCloud
      ? Promise.resolve(this.versionCloud)
      : this.http.get(this.verUrl).toPromise()
        .then(res => res.json().data)
        .then(data => {
          this.packageInfo.version = data[0].version;
          this.packageInfo.version_code = data[0].version_code;
          this.packageInfo.platform = data[0].platform;
          this.packageInfo.size = data[0].size;
          this.packageInfo.level = data[0].level;
          this.packageInfo.url = data[0].url;
          this.packageInfo.description = data[0].description;
          this.packageInfo.md5 = data[0].md5;
          return this.versionCloud = data[0].version_code;
        });
  }

  /** 检测是否有新版本 */
  checkNewVersion() {
    return this._versionCheckPromise = Promise.all([
      this.getVersionCloud(),
      this.getVersionLocal()
    ]).then(versions => {
      const cloud = Number.parseInt(versions[0]);
      const local = versions[1].split('.').map(item => Number.parseInt(item));
      let localVersion = local[0]*100 + local[1]*10 + local[2]*1;
      if(localVersion < cloud) {
        return true;
      }
      return false;
    }).catch(() => {});
  }

  /** 下载更新包 */
  download(): Observable<any>{
    // this.luaOtherService.download(this.packageInfo.url, this.packageInfo.md5).subscribe(data => {
    //   let res = JSON.parse(JSON.stringify(data));
    //   console.log(res);
    //   if(res.name === "Error") {
    //
    //   } else {
    //     this.downloading = this.versionCloud;
    //      localStorage.setItem('downloaded', this.downloading);
    //   }
    // });
    return this.luaOtherService.download(this.packageInfo.url, this.packageInfo.md5);
  }

  /** 安装更新包 */
  setup() {
    localStorage.setItem('imgCode', 'false');
    //this.luaOtherService.exec();
  }

  /** 取消下载 */
  abort() {
    this.downloading = '0.0.0';
  }

  saveUpgradeStorage() {
    localStorage.setItem('upgrade-data', JSON.stringify(this.upgradeStorage));
  }

}
