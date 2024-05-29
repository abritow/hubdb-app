const Config = require('../src/lib/config');

async function task() {
	const hubspot = require('@hubspot/api-client');

	const hubspotClient = new hubspot.Client({ developerApiKey: Config.read('HUBSPOT_DEVELOPER_API_KEY') });
	const appId = Config.read('APP_ID')

	const labels = {
		"en": {
			"actionName": "Associate object",
			"actionDescription": "This action will associate your object using the provided information",
			"actionCardContent": `Your object will be associated to a {{ associatedObjectType }} using the search value "{{ searchValue }}" on the target object's property {{ associatedObjectProperty }} and the association label {{ associatedLabel }}`,
			"inputFieldLabels": {
				"associatedObjectType": "associatedObjectType",
				"associatedObjectProperty": "associatedObjectProperty",
				"searchValue": "searchValue",
				"associatedLabel": "associatedLabel"
			}
		}
	};

	const objectRequestOptions = {
		"properties": [
			"hs_object_id"
		]
	};

	const ExtensionActionDefinitionInput = {
		actionUrl: `${Config.read('BASE_URL')}/actions/associate`,
		published: true,
		inputFields: [
			{
				"typeDefinition": {
					"name": "associatedObjectType",
					"type": "enumeration",
					"fieldType": "select",
					"optionsUrl": `${Config.read('BASE_URL')}/api/hubspot/objectTypes`
				},
				"supportedValueTypes": ["STATIC_VALUE"],
				"isRequired": true
			},
			{
				"typeDefinition": {
					"name": "associatedObjectProperty",
					"type": "enumeration",
					"fieldType": "select",
					"optionsUrl": `${Config.read('BASE_URL')}/api/hubspot/objectProperties`
				},
				"supportedValueTypes": ["STATIC_VALUE"],
				"isRequired": true
			},
			{
				"typeDefinition": {
					"name": "searchValue",
					"type": "string",
					"fieldType": "text"
				},
				"supportedValueTypes": ["STATIC_VALUE"],
				"isRequired": true
			},
			{
				"typeDefinition": {
					"name": "associationLabel",
					"type": "enumeration",
					"fieldType": "select",
					"optionsUrl": `${Config.read('BASE_URL')}/api/hubspot/labels`
				},
				"supportedValueTypes": ["STATIC_VALUE"],
				"isRequired": true
			}
		],
		outputFields: [
            {
                "typeDefinition": {
                    "name": "associated",
                    "type": "bool",
                    "fieldType": "booleancheckbox"
                }
		    }
        ],
		labels,
		objectRequestOptions,
		inputFieldDependencies: [{
			dependencyType: "SINGLE_FIELD",
			dependentFieldNames: ["associatedObjectProperty", "associationLabel"],
			controllingFieldName: "associatedObjectType"
		}],
		objectTypes: []
	};

	try {
		const apiResponse = await hubspotClient.automation.actions.definitionsApi.update('61383724', appId, ExtensionActionDefinitionInput);
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