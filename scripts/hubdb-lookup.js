const Config = require('../src/lib/config');

async function task() {
    const hubspot = require('@hubspot/api-client');

    const hubspotClient = new hubspot.Client({ developerApiKey: Config.read('HUBSPOT_DEVELOPER_API_KEY') });
    const appId = Config.read('APP_ID');

    const labels = {
        "en": {
            "actionName": "Search HubDB",
            "actionDescription": "This action will search a HubDB table using the provided information",
            "actionCardContent": `Your action will search for {{ searchableValue }} in the {{ selectedColumn }} column of the {{ selectedTable }} table.`,
            "inputFieldLabels": {
                "selectedTable": "Select HubDB Table",
                "searchableValue": "Searchable Value",
                "selectedColumn": "Select Column to Search"
            }
        }
    };

    const objectRequestOptions = {
        "properties": []
    };

    const ExtensionActionDefinitionInput = {
        actionUrl: `${Config.read('BASE_URL')}/actions/search-hubdb`,
        published: true,
        inputFields: [
            {
                "typeDefinition": {
                    "name": "selectedTable",
                    "type": "enumeration",
                    "fieldType": "select",
                    "optionsUrl": `${Config.read('BASE_URL')}/api/hubspot/hubdb/tables`
                },
                "supportedValueTypes": ["STATIC_VALUE"],
                "isRequired": true
            },
            {
                "typeDefinition": {
                    "name": "searchableValue",
                    "type": "string",
                    "fieldType": "text"
                },
                "supportedValueTypes": ["STATIC_VALUE"],
                "isRequired": true
            },
            {
                "typeDefinition": {
                    "name": "selectedColumn",
                    "type": "enumeration",
                    "fieldType": "select",
                    "optionsUrl": `${Config.read('BASE_URL')}/api/hubspot/hubdb/columns`
                },
                "supportedValueTypes": ["STATIC_VALUE"],
                "isRequired": true
            }
        ],
        outputFields: [
            {
                "typeDefinition": {
                    "name": "searchResult",
                    "type": "string",
                    "fieldType": "text"
                }
            }
        ],
        labels,
        objectRequestOptions,
        objectTypes: []
    };

    try {
        const apiResponse = await hubspotClient.automation.actions.definitionsApi.create(appId, ExtensionActionDefinitionInput);
        console.log(JSON.stringify(apiResponse, null, 2));
    } catch (e) {
        e.message === 'HTTP request failed'
            ? console.error(JSON.stringify(e.response, null, 2))
            : console.error(e)
    }
}

if (require.main === module) {
    task()
} else {
    module.exports = task
}
