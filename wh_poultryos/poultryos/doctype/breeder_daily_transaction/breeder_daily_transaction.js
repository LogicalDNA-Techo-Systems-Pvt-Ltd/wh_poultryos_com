// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Breeder Daily Transaction', {

    validate: function (frm) {
        // Ensure the Transaction Date is not in the future when validating
        let transaction_date = frm.doc.transaction_date;
        let batch_placed_on = frm.doc.batch_placed_on;
        let mortality_number_of_birds = frm.doc.mortality_number_of_birds;
        let feed_consumed_quantity = frm.doc.feed_consumed_quantity;
        let batch_live_quantity = frm.doc.batch_live_quantity;
        let average_bird_weight_in_grams = frm.doc.average_bird_weight_in_grams;

        let current_date = frappe.datetime.get_today();

        // Transaction Date can't be in the future
        if (transaction_date > current_date) {
            frappe.msgprint(__('Transaction Date cannot be in the future'));
            frappe.validated = false;
            return;
        }

        // Transaction Date must be >= Batch Placed On
        if (transaction_date < batch_placed_on) {
            frappe.msgprint(__('Transaction Date must be greater than or equal to Batch Placed On'));
            frappe.validated = false;  // Prevent form submission
            return;
        }

        // Mortality Number of Birds Validation
        if (mortality_number_of_birds <= 0) {
            frappe.msgprint(__('Mortality (Number of birds) must be greater than 0'));
            frappe.validated = false;  // Prevent form submission
            return;
        }

        if (mortality_number_of_birds > batch_live_quantity) {
            frappe.msgprint(__('Mortality (Number of birds) cannot be greater than live quantity'));
            frappe.validated = false;  // Prevent form submission
            return;
        }

        // Feed Consumed Quantity Validation
        if (feed_consumed_quantity <= 0) {
            frappe.msgprint(__('Feed (Consumed Quantity) must be greater than 0'));
            frappe.validated = false;  // Prevent form submission
            return;
        }

        // Average Bird Weight Validation
        if (average_bird_weight_in_grams <= 0) {
            frappe.msgprint(__('Average Bird Weight (In Grams) must be greater than 0'));
            frappe.validated = false;  // Prevent form submission
            return;
        }
    },

    average_bird_weight_in_grams: function (frm) {
        // Automatically update weight in KG when weight in grams is entered
        frm.set_value("average_bird_weight_in_kg", (frm.doc.average_bird_weight_in_grams / 1000));
    },

    batch: function (frm) {
        // Set the max date for the Transaction Date field to today
        frm.fields_dict['transaction_date'].df['max'] = frappe.datetime.get_today();
        frm.fields_dict['transaction_date'].refresh();  // Refresh to apply the change

        // Fetch the last transaction date for the same batch
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Breeder Daily Transaction',
                filters: { 'batch_placed_on': frm.doc.batch_placed_on },  // Filter transactions by batch_placed_on
                fields: ['transaction_date'],
                order_by: 'transaction_date desc',  // Order by latest transaction date
                limit_page_length: 1  // Only get the most recent transaction
            },
            callback: function (data) {
                if (data && data.message && data.message.length > 0) {
                    // If a transaction exists, set the next day as the transaction date
                    let last_transaction_date = data.message[0].transaction_date;
                    let next_day = frappe.datetime.add_days(last_transaction_date, 1);
                    frm.set_value('transaction_date', next_day);
                } else {
                    // If no transaction exists, set the transaction date as batch_placed_on
                    frm.set_value('transaction_date', frm.doc.batch_placed_on);
                }
            }
        });
    },

    after_save: function (frm) {
        let mortality_number_of_birds = frm.doc.mortality_number_of_birds;

        // If there is mortality number of birds
        if (mortality_number_of_birds > 0) {
            // Get the batch data to update the live birds count, using frm.doc.batch as identifier
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Batch',
                    name: frm.doc.batch  // Use the batch identifier from the form
                },
                callback: function (batch_data) {
                    if (batch_data && batch_data.message.live_quantity_number_of_birds !== undefined) {
                        let batch_placed_quantity = batch_data.message.place_quantity_number_of_birds;
                        let current_batch_live_quantity = batch_data.message.live_quantity_number_of_birds;

                        // Fetch all transactions related to the batch to calculate total mortality
                        frappe.call({
                            method: 'frappe.client.get_list',
                            args: {
                                doctype: 'Breeder Daily Transaction',
                                filters: { 'batch': frm.doc.batch },  // Filter transactions by batch
                                fields: ['mortality_number_of_birds'],
                                order_by: 'transaction_date asc',  // Order transactions by date (ascending)
                            },
                            callback: function (transactions) {
                                if (transactions && transactions.message) {
                                    // Calculate the total mortality from all transactions
                                    let total_mortality = 0;
                                    transactions.message.forEach(function (transaction) {
                                        total_mortality += transaction.mortality_number_of_birds || 0;
                                    });
                                    console.log(batch_placed_quantity);
                                    console.log(total_mortality);
                                    // Deduct the total mortality from the batch placed quantity
                                    let updated_batch_live_quantity = batch_placed_quantity - total_mortality;
                                    console.log(updated_batch_live_quantity);
                                    // Prevent updating if the live bird count goes negative
                                    if (updated_batch_live_quantity < 0) {
                                        frappe.msgprint(__('Total Mortality cannot be greater than the placed quantity of birds.'));
                                        frappe.validated = false;  // Prevent form submission
                                        return;
                                    } else {
                                        // Update the batch with the new live bird count
                                        frappe.call({
                                            method: 'frappe.client.set_value',
                                            args: {
                                                doctype: 'Batch',
                                                name: frm.doc.batch,
                                                fieldname: 'live_quantity_number_of_birds',
                                                value: updated_batch_live_quantity
                                            },
                                            callback: function () {
                                                frappe.validated = true;  // Allow form to be saved
                                            }
                                        });
                                    }
                                } else {
                                    frappe.msgprint(__('No transactions found for the specified batch.'));
                                    frappe.validated = false;  // Prevent form submission if no transactions are found
                                }
                            }
                        });
                    } else {
                        frappe.msgprint(__('Batch data not found.'));
                        frappe.validated = false;  // Prevent form submission if batch data is missing
                    }
                }
            });
        }
    }

});