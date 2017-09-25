import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
@Injectable()
export class ActivationService {
    private url: string = 'http://182.254.245.83:8000';
    constructor(private http: Http) {}
    getApplicationDataFromPost(company, array) {
        return this.http.post(this.url + '/api/v1/cloud/device/activation', {company: company, serial: array})
            .toPromise()
            .then(data => data.json())
            .then(data => {return data; })
            .catch(error => {return []});
    }
}