 
/* Code by CafeForce || www.cafeforce.com || support@cafeforce.com || Mandatory Header */
 
import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchObjectList from '@salesforce/apex/MassFilesDownloadController.fetchObjectList';
import fetchFiles from '@salesforce/apex/MassFilesDownloadController.fetchFiles';
 
export default class MassFilesDownload extends NavigationMixin(LightningElement) {
 
    @api objectApiName;
    @api recordId;
    @track objectOptions = [];
    @track yearOptions = [];
    @track monthOptions = [];
    @track selectedObject;
    @track selectedYear;
    @track selectedMonth;
    @track recordList;
    @track data;
    @track pageNumber = 1;
    @track recordSize = '10';
    @track totalRecords;
    @track totalPages;
    @track showSpinner;
    @track selectedFiles = new Set();
 
    connectedCallback() {
        if(this.recordId) {
            this.fetchDocumentRecords();
        } else {
            this.showSpinner = true;
            fetchObjectList()
            .then(result => {
                this.objectOptions = result;
 
                var today = new Date();
                var yearList = [];
                yearList.push({'label': (today.getFullYear() - 2).toString(), 'value': (today.getFullYear() - 2).toString()});
                yearList.push({'label': (today.getFullYear() - 1).toString(), 'value': (today.getFullYear() - 1).toString()});
                yearList.push({'label': today.getFullYear().toString(), 'value': today.getFullYear().toString()});
                this.yearOptions = yearList;
 
                var monthList= [];
                for(var i = 1; i <= 12; i++) {
                    monthList.push({'label': i.toString(), 'value': i.toString()});            
                }
                this.monthOptions = monthList;
                this.showSpinner = false;
            }).catch(error => {
                console.log(error);
                this.showSpinner = false;
            })
        }
    }
 
    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
    }
 
    handleYearChange(event) {
        this.selectedYear = event.detail.value;
    }
 
    handleMonthChange(event) {
        this.selectedMonth = event.detail.value;
    }
 
    get disableFetch() {
        if(!this.selectedObject)
            return true;
    }
 
    get totalFiles() {
        return this.data.length;
    }
 
    get recordSizeList() {
        let recordSizeList = [];
        recordSizeList.push({'label':'10', 'value':'10'});
        recordSizeList.push({'label':'25', 'value':'25'});
        recordSizeList.push({'label':'50', 'value':'50'});
        recordSizeList.push({'label':'100', 'value':'100'});
        return recordSizeList;
    }
 
    get disablePreviousButton() {
        if(!this.data || this.data.length == 0 || this.pageNumber == 1)
            return true;
    }
 
    get disableNextButton() {
        if(!this.data || this.data.length == 0 || this.pageNumber == this.totalPages)
            return true;
    }
 
    get disableRecordDropdown() {
        if(!this.data || this.data.length == 0)
            return true;
    }
 
    downloadFiles() {
        if(this.selectedFiles && this.selectedFiles.size > 0) {
            for(let item of this.selectedFiles) {
                this.download(item);
            }
        } else {
            this.showNotification('Please select a File', 'error');
        }
    }
 
    handleCheckbox(event) {
        let checkbox = this.template.querySelectorAll('[data-id="headerCheckbox"]');
        if(this.selectedFiles.has(event.target.name) && !event.target.checked) {
            checkbox[0].checked = false;
            this.selectedFiles.delete(event.target.name);
        } else {
            this.selectedFiles.add(event.target.name);
            if(this.selectedFiles.size == this.recordList.length) {
                checkbox[0].checked = true;
            }
        }
    }
 
    handleHeaderCheckbox(event) {
        let checkboxes = this.template.querySelectorAll('[data-id="checkbox"]')
        for(let i=0; i<checkboxes.length; i++) {
            checkboxes[i].checked = event.target.checked;
        }
        
        for(let i = 0; i < this.recordList.length; i++) {
            if(event.target.checked) {
                this.selectedFiles.add(this.recordList[i].ContentDocumentId);
            } else {
                this.selectedFiles.delete(this.recordList[i].ContentDocumentId);
            }
        }
        this.headerCheckbox = true;
    }
 
    resetCheckboxes() {
        let checkboxes = this.template.querySelectorAll('[data-id="checkbox"]')
        for(let i=0; i<checkboxes.length; i++) {
            checkboxes[i].checked = false;
        }
        let headerCheckbox = this.template.querySelectorAll('[data-id="headerCheckbox"]');
        if(headerCheckbox && headerCheckbox.length > 0)
            headerCheckbox[0].checked = false;
    }
 
    handleRecordSizeChange(event) {
        this.recordSize = event.detail.value;
        this.pageNumber = 1;
        this.totalPages = Math.ceil(this.totalRecords / Number(this.recordSize));
        this.processRecords();
    }
 
    handleNavigation(event){
        let buttonName = event.target.name;
        if(buttonName == 'Next') {
            this.pageNumber = this.pageNumber >= this.totalPages ? this.totalPages : this.pageNumber + 1;
        } else if(buttonName == 'Previous') {
            this.pageNumber = this.pageNumber > 1 ? this.pageNumber - 1 : 1;
        }
        this.processRecords();
    }
 
    processRecords() {
        this.selectedFiles = new Set();
        this.resetCheckboxes();
        this.showSpinner = true;
        var uiRecords = [];
        var startLoop = ((this.pageNumber - 1) *  Number(this.recordSize));
        var endLoop =  (this.pageNumber *  Number(this.recordSize) >= this.totalRecords) ? this.totalRecords : this.pageNumber *  Number(this.recordSize);
        for(var i = startLoop; i < endLoop; i++) {
            uiRecords.push(JSON.parse(JSON.stringify(this.data[i])));
        }
        this.recordList = JSON.parse(JSON.stringify(uiRecords));
        this.showSpinner = false;
    }
 
    fetchDocumentRecords() {
        this.showSpinner = true;
        this.pageNumber = 1;
        this.recordList = [];
        this.data = [];
        this.selectedFiles = new Set();
        this.resetCheckboxes();
        fetchFiles({
            objectName : this.selectedObject,
            recordId : this.recordId,
            year : this.selectedYear,
            month : this.selectedMonth
        })
        .then(result => {
            //console.log(result);
            if(result && result.length > 0) {
                for(var i = 0; i < result.length; i++) {
                    var contentSize = result[i].ContentDocument.ContentSize;
                    var size = (contentSize >= 1024) ? ((contentSize/1024 >= 1024) ? (Number(contentSize/1048576).toFixed(2) + ' MB') : (Number(contentSize/1024).toFixed(2) + ' KB')) : (Number(contentSize).toFixed(2) + ' Bytes');
                    result[i].size = size;
                    result[i].count = i+1;
                    result[i].check = false;
                }
                this.totalRecords = result.length;
                this.totalPages = Math.ceil(Number(result.length)/Number(this.recordSize));
                this.data = JSON.parse(JSON.stringify(result));
                
                var uiRecords = [];
                var recordDisplaySize = result.length < Number(this.recordSize) ? result.length : Number(this.recordSize);
                for(var i = 0; i < recordDisplaySize; i++) {
                    uiRecords.push(JSON.parse(JSON.stringify(result[i])));
                }
                this.recordList = JSON.parse(JSON.stringify(uiRecords));
            }
            this.showSpinner = false;
        }).catch(error => {
            console.log(error);
            if(error && error.body && error.body.message)
                this.showNotification(error.body.message, 'error');
            this.showSpinner = false;
        })
    }
 
    showNotification(message, variant) {
        const evt = new ShowToastEvent({
            'message': message,
            'variant': variant
        });
        this.dispatchEvent(evt);
    }
 
    navigateToRecordViewPage(event) {
        if(event.currentTarget.dataset.key) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: event.currentTarget.dataset.key,
                    objectApiName: 'ContentDocument',
                    actionName: 'view'
                }
            });
        }
    }
 
    downloadFile(event) {
        if(event.target.name) {
            this.download(event.target.name);
        }
    }
 
    download(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: window.location.origin + '/sfc/servlet.shepherd/document/download/' + recordId
            }
        }, false);
    }
}
/* 
    Code by CafeForce 
    Website: http://www.cafeforce.com 
    DO NOT REMOVE THIS HEADER/FOOTER FOR FREE CODE USAGE 
*/
 