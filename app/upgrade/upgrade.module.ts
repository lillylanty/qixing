import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UpgradeComponent } from './upgrade.component';
import { UpgradeService } from './upgrade.service';
import { MdCheckboxModule, MdProgressBarModule } from "@angular/material";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdCheckboxModule,
    MdProgressBarModule
  ],
  exports: [
    UpgradeComponent
  ],
  declarations: [
    UpgradeComponent
  ],
  bootstrap: [UpgradeComponent],
  providers: [
    UpgradeService
  ],

})
export class UpgradeModule { }
