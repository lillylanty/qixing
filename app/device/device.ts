import { RobotService } from '../robot-service/robot.service';
import { Base64 } from './base64';
import { ControlDeviceService } from '../new-service/control-device.service';
import { MdSnackBar } from '@angular/material';
import {data} from "../device-manage/data";
import {Observable} from "rxjs";
import { LuaLpegService } from "../new-service/lua-lpeg.service";
import { ProgramService } from '../common/program.service';
import { DeviceError } from '../new-service/device-model-interface';
import { Program } from '../program-list/program';
const SIZE = 100; // 程序段的大小

const INITMAXTIMES = 60; // 获取初始化信息的最大次数6
const INITINTERVAL = 1000; // 获取初始化信息的间隔5s

/*interface InstallIn {
    id: string;
    md5: string;
    name: string;
    total: number;
    index: number;
    data: string;
}*/

export interface InstallIn {
  "type": "script" | "update",  //运行脚本 | 升级文件
  "file_name": string,
  "id": string,
  "md5": string,
  "total": number,
  "index": number,
  "data": string
}

export interface StartInitIn {
    mode: number;
    joint_1: boolean;
    joint_2: boolean;
    joint_3: boolean;
    joint_4: boolean;
}

export interface ConnectInfo {
    joint_1: number;
    joint_2: number;
    joint_3: number;
    joint_4: number;
    main_io: number;
    tool_io: number;
}

export interface AxisInfo {
    joint_1: number;
    joint_2: number;
    joint_3: number;
    joint_4: number;
}

export interface InitInfoOut {
    stage: number;
    mode: number;
    connected: ConnectInfo;
    initialized: AxisInfo;
    executing: AxisInfo;
    result: AxisInfo;
}

export class DeviceInfo {
    serial: string;
    name: string;
    group: string;
    device_ip: string;
    model: string;
    status: number;
    version: string;
    controlled: boolean;
    program_name: string;
    username: string;
    controller_ip: string;
    request_ip: string;
}


export class Device {
    readonly serial: string;
    readonly name: string;
    readonly group: string;
    readonly device_ip: string;
    readonly request_ip: string;
    readonly model: string;
    private _status: number;
    get status() {
        return this._status
    }
    set status(val) {
        this._status = val;
    }
    readonly version: string;
    private _controlled = true
    get controlled() {
        return this._controlled;
    }
    private _program_name: string;
    get program_name() {
        return this._program_name;
    }
    set program_name(name){
        this._program_name = name;
    }
    readonly username: string;
    readonly controller_ip: string;
    private _initData: InitInfoOut = null;
    get initData() {
        return this._initData;
    }
    robotService: RobotService;
    controlDeviceService: ControlDeviceService;
    programService: ProgramService;
    luaLpegService: LuaLpegService;
    private initTimes = 1;

    private _installDisabled = true
    get installDisabled() {
        return this._installDisabled
    }
    private _initDisabled = true
    get initDisabled() {
        return this._initDisabled
    }
    set initDisabled(value) {
        this._initDisabled = value;
    }
    private _stopDisabled = true
    get stopDisabled() {
        return this._stopDisabled
    }
    private _runDisabled = true
    get runDisabled() {
        return this._runDisabled
    }
    set runDisabled(value) {
        this._runDisabled = value;
    }
    private _speedDisabled = true
    get speedDisabled() {
        return this._speedDisabled
    }
    set speedDisabled(value) {
        this._speedDisabled = value;
    }
    private _isRunning = false;
    get isRunning() {
        return this._isRunning;
    }
    set isRunning(value) {
        this._isRunning = value;
    }
    private _isStopping = false;
    get isStopping() {
        return this._isStopping;
    }
    private _isIniting = false;
    get isIniting() {
        return this._isIniting;
    }
    set isIniting(value) {
        this._isIniting = value;
    }
    private _isInstalling = false;
    get isInstalling() {
        return this._isInstalling;
    }
    private base64 = new Base64();
    private currentSegment: InstallIn = {"type": "script", "file_name": '', "id": '13213', "md5": '5646465sd4f', "total": 0, "index": 0, "data": ''};
    private _installProgress = 0;
    get installProgress() {
        return this._installProgress;
    }

    constructor(deviceInfo: DeviceInfo, robotService: RobotService,
                luaLpegService: LuaLpegService,
                programService: ProgramService,
                controlDeviceService: ControlDeviceService) {
        this.serial = deviceInfo.serial;
        this.group = deviceInfo.group;
        this.device_ip = deviceInfo.device_ip;
        this.model = deviceInfo.model;
        this.request_ip = deviceInfo.request_ip;
        this.version = deviceInfo.version;
        this._program_name = deviceInfo.program_name;
        this.username = deviceInfo.username;
        this.name = deviceInfo.name;
        this.controller_ip = deviceInfo.controller_ip;
        this.robotService = robotService;
        this.programService = programService;
        this.luaLpegService = luaLpegService;
        this.controlDeviceService = controlDeviceService;
        this._status = deviceInfo.status;
        this._controlled = deviceInfo.controlled;
        this.statusSetting(this.status)
    }

    // 关机
    shutdownDevice() { }

    // 初始化
    /*initDevice(data: StartInitIn): Promise<{ type: 'success' | 'warn' | 'error'; description: string }> {
        if (!this._initDisabled && !this.isIniting) {
            this._isIniting = true;
            return this.robotService.startInit(data).toPromise().then((data): Promise<{ type: 'success' | 'warn' | 'error'; description: string }> => {
                if (data.error) {
                    this._isIniting = false;
                    return new Promise((resolve, reject) => {
                        resolve({ type: 'error', description: '状态:' + data.error.status + ',描述:' + data.error.description });
                    })
                }
                if (data.success) {
                    this.initTimes = 1;
                    return this.initing();
                }
            });
        }

    }
*/

  initDevice(data: StartInitIn): Promise<any> {
    if (!this._initDisabled && !this.isIniting) {
        this._isIniting = true;
        return this.controlDeviceService.deviceInitialize(data).toPromise().then((info): Promise<any> => {
          let res = JSON.parse(JSON.stringify(info));
          if (res.message) {
            this._isIniting = false;
            return new Promise((resolve, reject) => {
              resolve({ type: res.name, description: '描述:' + info.message });
            })
          }
          if (res === true || !res) {
            this.initTimes = 1;
            return this.initing();
            /*this._isIniting = false;
            this._status = 1;
            this.statusSetting(this.status);
            return new Promise((resolve, reject) => {
              resolve({ type: 'success', description: '描述:初始化成功'});
            });*/
          }
        });
    }

  }



  public initing(): Promise<any> {
        return this.controlDeviceService.deviceInitializedRead().toPromise().then((data): Promise<any> => {
          let res = JSON.parse(JSON.stringify(data));
            console.log(res);
            if (res.message) {
                this._isIniting = false;
                return new Promise((resolve, reject) => {
                    resolve({ type: res.name, description: '描述:' + res.message });
                })
            } else {
                this._initData = data;
                if (this._initData.result.joint_1 === 1 && this._initData.result.joint_2 === 1 && this._initData.result.joint_3 === 1 && this._initData.result.joint_4 === 1) {
                    this._isIniting = false;
                    this._status = 1;
                    this.statusSetting(this.status)
                    return new Promise((resolve, reject) => {
                        resolve({ type: 'success', description: '初始化成功！' });
                    })
                } else {
                    if (this.initTimes < INITMAXTIMES) {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                this.initTimes++;
                                this.initing().then(data => resolve(data));
                            }, INITINTERVAL)
                        })
                    } else {
                        this._isIniting = false;
                        return new Promise((resolve, reject) => {
                            resolve({ type: 'error', description: '初始化超时！' });
                        })
                    }
                }
            }
        })
    }
  /*public initing(): Promise<any> {
    return this.controlDeviceService.deviceInitializedRead().toPromise().then((data): Promise<any> => {
      let res = JSON.parse(JSON.stringify(data));
      if (res.message) {
        this._isIniting = false;
        return new Promise((resolve, reject) => {
          resolve({ type: res.name, description: '描述:读取设备初始化信息失败！' });
        })
      } else {
        this._initData = data;
        if (this._initData.result.joint_1 === 1 && this._initData.result.joint_2 === 1 && this._initData.result.joint_3 === 1 && this._initData.result.joint_4 === 1) {
          this._isIniting = false;
          this._status = 1;
          this.statusSetting(this.status)
          return new Promise((resolve, reject) => {
            resolve({ type: 'success', description: '设备已初始化！' });
          })
        } else {
            this._isIniting = false;
            return new Promise((resolve, reject) => {
              resolve({ type: 'info', description: '设备未初始化！' });
            })
          }
        }
    })
  }
*/
    // 清除初始化数据
    clearInitData() {
        this._initData = null;
    }

    // 运行
    runDevice() : Observable<any> {
        this._isRunning = true;
        return this.controlDeviceService.deviceRun({script_name: this.program_name, cmd: "start"});
    }
    runStatus() : Observable<any> {
        return this.controlDeviceService.reported();
    }

    /*runDevice() {
        if (!this._runDisabled && !this.isRunning) {
            this._isRunning = true;
            /!*return this.controlDeviceService.deviceRun({script_name: this.currentSegment.file_name, cmd: "start"}).toPromise().then(data => {
              let res = JSON.parse(JSON.stringify(data));
              console.log(res);
              this._isRunning = false;
              if (res === true || !res) {
                this._status = 2;
                this.statusSetting(this.status);
              }
              return res;
            });*!/
            this.controlDeviceService.deviceRun({script_name: this.program_name, cmd: "start"}).subscribe(data => {
                let res = JSON.parse(JSON.stringify(data));
                this._isRunning = false;
                if (res === true || !res) {

                    this._status = 2;
                    this.statusSetting(this.status);
                    return res;

                }
                  return res;
            });
        }
    }
*/
    //读取运行时关节位置
  readJointPosition() {
    if (!this._runDisabled && !this.isRunning) {
      return this.robotService.readJointPosition().toPromise().then(data => {
        return data;
      });
    }
  }

    // 停止
    stopDevice() {
        if (!this._stopDisabled && !this._isStopping) {
            this._isStopping = true;
          return this.controlDeviceService.deviceRun({script_name: 'test.lua', cmd: "stop"}).toPromise().then(data => {
            let res = JSON.parse(JSON.stringify(data));
            this._isStopping = false;
            if (res === true || !res) {
              this._status = 1;
              this.statusSetting(this.status);
            }
            return res
          });
        }
    }

    // 调节速度
    setSpeedDevice(speed: number) {
        if (speed >= 0 && speed <= 100 && !this._speedDisabled) {
            let value = parseFloat((speed * 0.01).toFixed(2));
            return this.robotService.setVelocity({ velocity: value });
        }
    }

    toMachineCode(name:string) : Observable<string | DeviceError> {
        let pContent = JSON.parse(localStorage.getItem('$program_' + name))
        let treeData = this.programService.toLuaJSON(pContent.data[0],pContent.data[1]);
        return this.luaLpegService.machineCode(treeData);
    }
    toDeviceSend(filename:string, lua: string) : Observable<string | DeviceError> {
        return this.controlDeviceService.deviceFileSend("script", filename, lua);
    }
    // 安装程序
    installProgram(p: Program, code?: string) {
        let pCode: string = "";
        let pCodes: string[];
        if (!this._installDisabled && !this.isInstalling) {
            if (code) {
                pCode = code;
                pCodes = this.setProgramSegment(pCode);
                this.currentSegment = {
                    type: 'script',
                    id: '13213',
                    md5: '5646465sd4f',
                    file_name: p.name,
                    total: 0,
                    index: 1,
                    data: ''
                };
                this._installProgress = 0;
                this._isInstalling = true;
                return this.installingProgram(pCodes);
            } else {
                if (localStorage.getItem('$program_' + p.name)) {
                    let pContent = JSON.parse(localStorage.getItem('$program_' + p.name))
                    let treeData = this.programService.toLuaJSON(pContent.data[0],pContent.data[1]);

                    this.luaLpegService.machineCode(treeData).subscribe(data => {
                        let res = JSON.parse(JSON.stringify(data));
                        if(res.message) {
                            return new Promise((resolve, reject) => {
                                resolve({ type: 'error', description: res.message });
                            });
                        } else {
                            pCode = JSON.stringify(data);
                            if (pCode) {
                                pCode = this.base64.encode(pCode);
                                pCodes = this.setProgramSegment(pCode);
                                this.currentSegment = {
                                    type: 'script',
                                    id: '13213',
                                    md5: '5646465sd4f',
                                    file_name: p.name,
                                    total: 0,
                                    index: 1,
                                    data: ''
                                };
                                this._installProgress = 0;
                                this._isInstalling = true;
                                return this.installingProgram(pCodes);
                            } else {
                                return new Promise((resolve, reject) => {
                                    resolve({ type: 'error', description: '程序为空，无法安装！' });
                                });
                            }
                        }
                    });
                    //pCode = JSON.parse(localStorage.getItem('$program_' + p.name)).lua;
                } else {
                    return new Promise((resolve, reject) => {
                        resolve({ type: 'error', description: '未找到相应的安装程序代码！' });
                    });
                }
            }
        } else {
            return new Promise((resolve, reject) => {
                resolve({ type: 'error', description: '请检查设备状态！' });
            });
        }
    }

    private setProgramSegment(programCode: string): string[] {
        const len = programCode.length;
        const count = Math.ceil(len / SIZE);
        const lastCodeNumber = len % SIZE;
        const programCodes: string[] = [];
        for (let i = 0; i < count; i++) {
            if (lastCodeNumber !== 0 && i === (count - 1)) {
                programCodes.push(programCode.substring(i * SIZE, i * SIZE + lastCodeNumber));
            } else {
                programCodes.push(programCode.substring(i * SIZE, (i + 1) * SIZE));
            }
        }
        return programCodes;
    }

    private installingProgram(codes: string[]): Promise<any> {
        this.currentSegment.id = '13213';
        this.currentSegment.md5 = '5646465sd4f';
        this.currentSegment.total = codes.length;
        this.currentSegment.data = codes[this.currentSegment.index - 1];
        return this.controlDeviceService.deviceFileSend(this.currentSegment.type, this.currentSegment.file_name, this.currentSegment.data).toPromise().then((data): Promise<any> => {
            let res = JSON.parse(JSON.stringify(data));
            console.log(res);
            if (res.message) {
                this._isInstalling = false;
                return new Promise((resolve, reject) => {
                    resolve({ type: 'error', description: res.message })
                });
            }
            if (res === true || !res) {
                this.currentSegment.index += 1;
                if (this.currentSegment.index > this.currentSegment.total) {
                    this._installProgress = +((this.currentSegment.index / this.currentSegment.total) * 100).toFixed(0);
                    this._isInstalling = false;
                    return new Promise((resolve, reject) => {
                        this._program_name = this.currentSegment.file_name;
                        resolve({ type: 'success', description: '安装成功！' });

                    });
                } else {
                    return this.installingProgram(codes);
                }
            }
        })
    }

    // 状态设置
    public statusSetting(term: number) {
        switch (term) {
            case 0:
                this._initDisabled = false;
                this._installDisabled = false;
                this._runDisabled = true;
                this._stopDisabled = true;
                this._speedDisabled = true;
                break;
            case 1:
                //this._initDisabled = false;
                this._initDisabled = true;
                this._installDisabled = false;
                this._runDisabled = false;
                this._stopDisabled = true;
                this._speedDisabled = true;
                break;
            case 2:
                this._initDisabled = true;
                this._installDisabled = true;
                this._runDisabled = true;
                this._stopDisabled = false;
                this._speedDisabled = false;
                break;
            case 3:
                //this._initDisabled =
                this._initDisabled = false;
                this._installDisabled = true;
                this._runDisabled = true;
                this._stopDisabled = true;
                this._speedDisabled = true;
                break;
            default:
                // 出错
                break
        }
    }
}
