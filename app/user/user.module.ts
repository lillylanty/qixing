import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LoginComponent } from './login.component';
import { UserComponent } from './user.component';
import {  MaterialModule, MdInputModule, MdButtonModule } from "@angular/material";
import { ActivationModule } from '../activation/activation.module';
import { shortcutComponent } from '../structure/user-setting/shortcut.component';
import { FlexLayoutModule } from "@angular/flex-layout";
// import { shortcut } from '../structure/user-setting/shortcut';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    MdInputModule,
    MdButtonModule,
    FormsModule,
    ActivationModule,
    FlexLayoutModule
  ],
  declarations: [
    LoginComponent,
    UserComponent,
    shortcutComponent,
    //shortcut
  ],
  exports: [
    LoginComponent,
    UserComponent,
    
  ],
})
export class UserModule { }
