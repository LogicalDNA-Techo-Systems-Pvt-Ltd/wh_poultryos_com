// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('CBF Daily Transaction', {

    onload: function (frm) {
        // Set a query filter for the Item Name field
        frm.set_query('item_name', function () {
            return {
                filters: {
                    item_type: ['in', ['Feed', 'Medicine']] // Only include Feed and Medicine
                }
            };
        });
    },

    mortality_number_of_birds: function (frm) {
        if (frm.doc.mortality_number_of_birds) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'CBF Batch',
                    name: frm.doc.batch // Use the batch identifier from the form
                },
                callback: function (batch_data) {

                    console.log(batch_data);
                    if (batch_data && batch_data.message) {

                        let cost = batch_data.message.bird_cost;
                        let mcost = ((frm.doc.mortality_number_of_birds * cost).toFixed(4));
                        frm.set_value('mortality_cost', mcost);

                    }

                }
            });
        }
    },

    item_name: function (frm) {
        // Recalculate feed cost when item changes
        if (frm.doc.transaction_date) {
            frm.trigger('transaction_date');

            // Fetch standard consumption from Std Chart based on item name and age

            if (frm.doc.item_name && frm.doc.batch_age_in_days) {
                frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'Standard Chart POS',
                        filters: {
                            item_name: frm.doc.item_name,   // Match item name
                            age_in_days: frm.doc.batch_age_in_days // Match age in weeks
                        },
                        fieldname: 'feed_consumption'
                    },
                    callback: function (response) {

                        if (response.message && Object.keys(response.message).length > 0) {
                            // Set the fetched standard consumption
                            let standardConsumption = response.message.feed_consumption;
                            frm.set_value('standard_consumption', standardConsumption);
                            frappe.msgprint(__('Standard Consumption fetched: {0}', [standardConsumption]));
                        } else {
                            frappe.msgprint(__('No matching standard consumption found for the selected item and age.'));
                            frm.set_value('standard_consumption', 0);
                        }
                    }
                });
            } else {
                frappe.msgprint(__('Please ensure Item Name and Age in Weeks are set.'));
            }

        }
    },

    transaction_date: function (frm) {

        if (!frm.doc.transaction_date) {
            frappe.msgprint(__('Please select a transaction date.'));
            return;
        }

        // // Ensure item is selected
        // if (!frm.doc.item_type) {
        //     frappe.msgprint(__('Please select an item.'));
        //     return;
        // }   

        console.log("Placement date", frm.doc.batch_placed_on);
        console.log(frm.doc.transaction_date);

        function standardizeDate(dateStr) {
            if (!dateStr) return null;

            // Check if date is already in YYYY-MM-DD format
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            }

            // Convert DD-MM-YYYY to YYYY-MM-DD
            let parts = dateStr.split('-');
            if (parts.length === 3) {
                // Ensure year is 4 digits
                if (parts[2].length === 4) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            return null;
        }

        // Get and standardize both dates
        let placementDate = standardizeDate(frm.doc.batch_placed_on);
        let transactionDate = standardizeDate(frm.doc.transaction_date);

        console.log("Standardized Placement Date:", placementDate);
        console.log("Standardized Transaction Date:", transactionDate);

        if (placementDate && transactionDate) {
            // Calculate difference in days
            let days_diff = frappe.datetime.get_diff(transactionDate, placementDate);
            console.log("Age in days:", days_diff);

            // Optionally set the value in a field
            frm.set_value('batch_age_in_days', days_diff);
            // Remember to refresh if you're setting a value
            frm.refresh_field('batch_age_in_days');
        } else {
            console.log("Error: Invalid date format");
        }

        // Fetch the appropriate rate for the transaction date
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Item Rate POS',
                filters: {
                    item_type: frm.doc.item_type, // Match the item type
                    date: ['<=', frm.doc.transaction_date] // Fetch rates up to the transaction date
                },
                fields: ['rate', 'date'],
                order_by: 'date desc', // Sort by latest date first
                limit_page_length: 1 // Fetch only the latest matching rate
            },
            callback: function (response) {
                if (response.message && response.message.length > 0) {
                    // Successfully fetched the latest rate
                    let rate_data = response.message[0];
                    let rate = rate_data.rate;


                    if (frm.doc.feed_consumed_quantity) {
                        let feed_cost = frm.doc.feed_consumed_quantity * rate;
                        frm.set_value('feed_cost', feed_cost);
                    } else {
                        frm.set_value('feed_cost', 0);
                    }
                } else {
                    // No matching rate found
                    frappe.msgprint(__('No rate found for the selected item and date.'));
                    frm.set_value('feed_cost', 0);
                }
            }
        });
    },

    ready_for_sale: function (frm) {

        if (!frm.doc.ready_for_sale && frm.doc.__prev_ready_for_sale) {
            // Prevent toggle from being turned off
            frappe.show_alert({
                message: __('Ready for Sale cannot be disabled once enabled'),
                indicator: 'red'
            }, 5);

            // Reset the toggle back to on
            frm.set_value('ready_for_sale', 1);

            return;
        }

        // if (frm.doc.ready_for_sale) {
        //     frappe.msgprint({

        //         message: __('This batch has been marked as ready for sale'),
        //         indicator: 'green'
        //     });
        // }

        // If turning on for the first time
        if (frm.doc.ready_for_sale) {
            // Show confirmation dialog
            frappe.confirm(
                'Are you sure you want to mark this batch as ready for sale? This action cannot be undone.',
                () => {
                    // On confirm
                    frm.doc.__prev_ready_for_sale = 1;

                    // Show success message
                    frappe.show_alert({
                        message: __('This batch is now available for ready for sale'),
                        indicator: 'green'
                    }, 5);

                    // Make the field read-only after enabling
                    frm.set_df_property('ready_for_sale', 'read_only', 1);

                    
                },
                () => {
                    // On cancel
                    frm.set_value('ready_for_sale', 0);
                }
            );
        }
    },


    feed_consumed_quantity: function (frm) {

        frm.doc.item = "Feed";
        console.log(frm.doc.item_type);

        if (frm.doc.item_type === "Feed") {
            frm.trigger('transaction_date');

        }
        else {
            frappe.msgprint(__('Sorry you are not selecting feed item.'));
        }



    },

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
        frm.fields_dict['transaction_date'].refresh(); // Refresh to apply the change

        if (frm.doc.batch) {
            // Fetch the opening date from the Batch Doctype
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'CBF Batch',
                    fieldname: 'opening_date',
                    filters: { name: frm.doc.batch }
                },
                callback: function (response) {
                    if (response.message && Object.keys(response.message).length > 0) {
                        let opening_date = response.message.opening_date;
                        if (opening_date) {
                            // Convert the date to user-preferred format
                            let formatted_date = frappe.datetime.str_to_user(opening_date);
                            frm.set_value('batch_placed_on', formatted_date);

                            // Fetch the last transaction date for the same batch
                            frappe.call({
                                method: 'frappe.client.get_list',
                                args: {
                                    doctype: 'CBF Daily Transaction',
                                    filters: { 'batch': frm.doc.batch }, // Filter transactions by batch
                                    fields: ['transaction_date'],
                                    order_by: 'transaction_date desc', // Order by latest transaction date
                                    limit_page_length: 1 // Only get the most recent transaction
                                },
                                callback: function (data) {
                                    if (data && data.message && data.message.length > 0) {
                                        // If a transaction exists, calculate the next day's date
                                        let last_transaction_date = data.message[0].transaction_date;
                                        let next_day = frappe.datetime.add_days(last_transaction_date, 1);
                                        frm.set_value('transaction_date', next_day);
                                    } else if (frm.doc.batch_placed_on) {
                                        // If no transaction exists, use the batch_placed_on date
                                        let batch_date = frappe.datetime.user_to_str(frm.doc.batch_placed_on);
                                        frm.set_value('transaction_date', batch_date);
                                    } else {
                                        frappe.msgprint(__('Batch placed date is missing.'));
                                    }
                                }
                            });
                        } else {
                            frappe.msgprint(__('Opening date not found for the selected batch.'));
                        }
                    }
                }
            });
        } else {
            frappe.msgprint(__('Please select a batch.'));
        }
    },

    after_save: function (frm) {

        let mortality_number_of_birds = frm.doc.mortality_number_of_birds;

        // If there is mortality number of birds
        if (mortality_number_of_birds > 0) {
            // Get the batch data to update the live birds count, using frm.doc.batch as identifier
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'CBF Batch',
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
                                doctype: 'CBF Daily Transaction',
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
                                                doctype: 'CBF Batch',
                                                name: frm.doc.batch,
                                                fieldname: 'live_quantity_number_of_birds',
                                                value: updated_batch_live_quantity
                                            },
                                            callback: function () {

                                                if (frm.doc.transaction_date) {

                                                    frappe.call({
                                                        method: 'frappe.client.get',
                                                        args: {
                                                            doctype: 'CBF Batch',
                                                            name: frm.doc.batch // Use the batch identifier from the form
                                                        },
                                                        callback: function (batch_data) {
                                                            if (batch_data && batch_data.message) {
                                                                let placement_date = batch_data.message.opening_date; // Placement Date from Batch
                                                                let placed_quantity = batch_data.message.place_quantity_number_of_birds; // Placed Quantity from Batch
                                                                let biological_value = batch_data.message.biological_value || 0; // Previous Biological Value

                                                                let live_batch_date = frappe.datetime.add_days(frm.doc.transaction_date, 1); // Transaction Date + 1 Day
                                                                let feed_cost = frm.doc.feed_cost || 0; // Feed Cost from the form
                                                                let mortality_cost = frm.doc.mortality_cost || 0; // Mortality Cost from the form

                                                                // Calculate Age in Days
                                                                if (placement_date && live_batch_date) {
                                                                    let age_in_days = frappe.datetime.get_diff(live_batch_date, placement_date);

                                                                    // Format Live Batch Date (DD-MM-YYYY)
                                                                    let formatted_live_batch_date = frappe.datetime.str_to_user(live_batch_date);

                                                                    // Calculate Mortality
                                                                    let mortality = 0;
                                                                    if (placed_quantity && updated_batch_live_quantity !== undefined) {
                                                                        mortality = placed_quantity - updated_batch_live_quantity;
                                                                        if (mortality < 0) {
                                                                            frappe.msgprint(__('Mortality cannot be negative. Please check the data.'));
                                                                            frappe.validated = false; // Prevent form submission
                                                                            return;
                                                                        }
                                                                    }

                                                                    // Update Biological Value
                                                                    let updated_biological_value = biological_value + feed_cost - mortality_cost;

                                                                    // Calculate Bird Cost
                                                                    let bird_cost = 0;
                                                                    if (updated_batch_live_quantity > 0) {
                                                                        // bird_cost = updated_biological_value / updated_batch_live_quantity;
                                                                        bird_cost = (updated_biological_value / updated_batch_live_quantity).toFixed(4);
                                                                    }

                                                                    // Update Batch with Live Batch Date and Age in Days
                                                                    frappe.call({
                                                                        method: 'frappe.client.set_value',
                                                                        args: {
                                                                            doctype: 'CBF Batch',
                                                                            name: frm.doc.batch,
                                                                            fieldname: {
                                                                                live_batch_date: formatted_live_batch_date,
                                                                                batch_age_in_days: age_in_days,
                                                                                mortality: mortality,
                                                                                biological_value: updated_biological_value,
                                                                                bird_cost: parseFloat(bird_cost) // Ensure it remains a numeric value
                                                                            }
                                                                        },
                                                                        callback: function () {
                                                                            frappe.msgprint(__('Batch updated successfully with live batch date and age in days.'));
                                                                        }
                                                                    });
                                                                } else {
                                                                    frappe.msgprint(__('Placement Date or Live Batch Date is missing.'));
                                                                }
                                                            } else {
                                                                frappe.msgprint(__('Batch data not found.'));
                                                            }
                                                        }
                                                    });

                                                }
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