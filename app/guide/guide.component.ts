import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


// import { Message } from 'angular.qixing-group.com';
import { MdSnackBar } from '@angular/material'

import { GuideService } from './guide.service';
import { UserService, LicenseService } from '../common';

import { Slide } from './carousel/slide.component';
import { Carousel } from './carousel/carousel.component';

class Image {
    name: string;
    title: string;
    description: string;
    position: {x: number, y: number};
}

@Component({
    selector: 'app-guide',
    templateUrl: './guide.component.html',
    styleUrls: [ './guide.component.css' ],
})
export class GuideComponent implements OnInit {
    //private imgData: Array<ImgMsg> = [];
    public slides: Array<Image> = [];
    public imgCode: boolean = true;
    //public skip = false;
    // msgs: Message[] = [];
    constructor(private router: Router,
                public guideservice: GuideService,
                private userService: UserService,
                private licenseService: LicenseService,
                public snackBar:MdSnackBar) {
    }
    ngOnInit() {
        if (localStorage.getItem('skip') === 'true') {
          this.guideservice.allowKey = false;
          if (this.userService.user.account && this.licenseService.license.length) {
            this.router.navigate(['main', {"outlets" :{'panel-top':['toolbar-program'], 'panel-left':['lua-tree'], 'panel-bottom':['terminal']}}]);
          } else {
            this.router.navigate(['login']);
          }
        } else {
            if(!localStorage.getItem('imgId')) {
                this.imgCode = false;
            } else {
                this.imgCode = true;
            }
           this.addNewSlide();
           //this.guideservice.allowKey = true;
        }
    }
    private addNewSlide() {
      this.slides = [];
        if(!localStorage.getItem("imgId")) {
            this.guideservice.getGuideImage().then(data => {
                this.slides = data.images;
            }).catch(error => {
                //this.snackBar.open(JSON.stringify(error),null,{duration: 500})
                this.slides = [];
            });
        } else {
            this.slides = JSON.parse(localStorage.getItem("newSlides")).images;
            localStorage.setItem('imgId', '' + JSON.parse(localStorage.getItem("newSlides")).id);
        }
        if(this.slides.length === 1) {
            this.guideservice.allowKey = false;
        } else {
            this.guideservice.allowKey = true;
        }
    }

    public onclick() {
        // localStorage.setItem('skip', '' + this.skip)
        localStorage.setItem('skip', 'true');
        if (this.userService.user.account && this.licenseService.license.length) {
          this.router.navigate(['main', {"outlets" :{'panel-top':['toolbar-program'], 'panel-left':['lua-tree'], 'panel-bottom':['terminal']}}]);
          localStorage.setItem('localLogin', 'true');
        } else {
          this.router.navigate(['login']);
        }
    }
}
