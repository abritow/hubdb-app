'use strict'

const Contacts = (hubspotClient) => {

	const getContacts = async () => {
		const contacts = await hubspotClient.crm.contacts.getAll();

		return contacts;
	};

	const methods = {
		getContacts
	}

	return methods;
};

module.exports = Contacts
