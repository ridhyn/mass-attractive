/* Code by CafeForce || www.cafeforce.com || support@cafeforce.com || Mandatory Header */
public with sharing class MassFilesDownloadController {
    
    @AuraEnabled
    public static List<PicklistOptions> fetchObjectList() {
        List<PicklistOptions> objectList = new List<PicklistOptions>();
        for(Schema.SObjectType objTyp : Schema.getGlobalDescribe().Values()) {
            Schema.DescribeSObjectResult describeSObjectRes = objTyp.getDescribe();
            if(describeSObjectRes.isQueryable() && describeSObjectRes.isUpdateable() && describeSObjectRes.isSearchable() && 
            describeSObjectRes.isAccessible() && describeSObjectRes.isCreateable() && !describeSObjectRes.isCustomSetting()) {
                String name = objTyp.getDescribe().getName();
                if(!name.containsignorecase('history') && !name.containsignorecase('tag')&&
                 !name.containsignorecase('share') && !name.containsignorecase('feed'))
                {
                    objectList.add( new PicklistOptions(describeSObjectRes.getLabel(), describeSObjectRes.getName()) );
                }
            }
        }
        objectList.sort();
        return objectList;
    }
 
    @AuraEnabled
    public static List<ContentDocumentLink> fetchFiles(String objectName, String recordId, String year, String month) {
        try {
            String query = 'SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileType, ContentDocument.ContentSize, ContentDocument.LastModifiedDate, ContentDocument.CreatedDate, LinkedEntity.Type FROM ContentDocumentLink ';
            if(String.isNotBlank(objectName)) {
                query += ' where LinkedEntityId in ( SELECT Id FROM '+objectName+') and LinkedEntity.Type =: objectName';
                if(String.isNotBlank(year)) {
                        query += ' AND calendar_year(ContentDocument.LastModifiedDate) = ' + year;
                }
                if(String.isNotBlank(month)) {
                    query += ' AND calendar_month(ContentDocument.LastModifiedDate) = '+month;
                }
            }
            if(String.isNotBlank(recordId)) {
                query += ' where LinkedEntityId = \'' + recordId + '\'';
            }
            return Database.query(query);
        } catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
 
    public class PicklistOptions implements Comparable {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        public PicklistOptions(String label, String value) {
            this.label = label;
            this.value = value;
        }
        public Integer compareTo(Object ObjToCompare) {
            return label.CompareTo(((PicklistOptions)ObjToCompare).label);
        }
    }
}
/* 
    Code by CafeForce 
    Website: http://www.cafeforce.com 
    DO NOT REMOVE THIS HEADER/FOOTER FOR FREE CODE USAGE 
*/
 