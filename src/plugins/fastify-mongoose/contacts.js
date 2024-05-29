'use strict'

const mongoose = require('mongoose');
const ContactModel = require('../../models/Contact');

const Contacts = () => {

	/**
	 *
	 * @param {object} contactData
	 * @returns {ContactModel} Created Contact
	 */
	 const createContact = async (contactData) => {
		const contact = new ContactModel(contactData);

		return await contact.save();
	}

	/**
	 *
	 * @returns {Array<ContractModel>} Contracts List
	 */
	 const getContacts = async () => {
		const contacts = await ContactModel.find();

		return contacts;
	}

	const methods = {
		createContact,
		getContacts
	}

	return methods;
};

module.exports = Contacts
