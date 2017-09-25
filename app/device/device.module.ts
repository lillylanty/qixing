import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceComponent, DialogDeviceList, DialogDeviceInit, DialogDeviceRun} from './device.component';
import { DeviceListComponent, DialogDelComponent } from './device-list/device-list.component';
import { DeviceInitComponent } from './device-init/device-init.component';
import { RobotService } from '../robot-service/robot.service';
import {MdButtonModule, MdRadioModule, MdIconModule, MdMenuModule, MdListModule, MdGridListModule,
    MdSliderModule, MdDialogModule, MdProgressBarModule, MdProgressSpinnerModule} from "@angular/material";
import { DataTableModule } from '../ui-component/table/datatable'
import { FlexLayoutModule } from "@angular/flex-layout";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DataTableModule,
    MdButtonModule,
    MdRadioModule,
    MdIconModule,
    MdMenuModule,
    MdListModule,
    MdSliderModule,
    MdDialogModule,
    MdGridListModule,
    MdProgressBarModule,
    FlexLayoutModule,
    MdProgressSpinnerModule
  ],
  declarations: [
    DeviceComponent,
    DeviceListComponent,
    DeviceInitComponent,
    DialogDeviceList,
    DialogDeviceInit,
    DialogDeviceRun,
    DialogDelComponent
  ],
  exports: [
      DeviceComponent,
  ],
  bootstrap: [DialogDeviceList, DialogDelComponent, DeviceComponent, DialogDeviceInit, DialogDeviceRun, DeviceInitComponent, DeviceListComponent],
  providers: [RobotService]
})

export class DeviceModule {

}
