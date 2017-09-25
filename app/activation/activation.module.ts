import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import { DataTableModule } from '../ui-component/table/datatable'
import {ActivationComponent} from './activation.component';
import { ActivationService } from './activation.service';
import { MaterialModule } from '@angular/material';

@NgModule({

    imports: [BrowserModule, DataTableModule, FormsModule,ReactiveFormsModule,MaterialModule,],

    exports: [ActivationComponent],
    declarations: [ActivationComponent],
    providers: [ActivationService],
})
export class ActivationModule { }
