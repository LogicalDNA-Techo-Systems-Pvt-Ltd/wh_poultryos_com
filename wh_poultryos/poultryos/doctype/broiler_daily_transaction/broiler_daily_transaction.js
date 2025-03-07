// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Broiler Daily Transaction', {


    refresh: function (frm) {

        frm.trigger('add_custom_buttons'); // Call function on refresh


    },

    add_custom_buttons: function (frm) {

        // Add "Reject" button inside "Actions" menu
        frm.add_custom_button(__('Complete the Batch'), () => {

            frappe.confirm(
                'Are you sure you want to mark this batch as completed? This action cannot be undone.',
                () => {
                    // On Confirm: Call the server method
                    frappe.call({
                        method: 'wh_poultryos.poultryos.doctype.broiler_batch.broiler_batch.update_batch_status',
                        args: {
                            batch_name: frm.doc.batch,  // Assuming 'batch' field exists in Broiler Daily Transaction                           
                            status: "Completed"
                        },
                        callback: function (r) {
                            if (r.message.status === "success") {
                                frappe.msgprint(__('Batch is Completed'));
                                frm.disable_save();
                            } else {
                                frappe.msgprint(__('Error updating batch status.'));
                            }
                        }
                    });


                },
                () => {
                    // On Cancel: Do nothing
                    frappe.show_alert({
                        message: __('Batch completion was cancelled'),
                        indicator: 'red'
                    }, 3);
                }
            );

        }, "Actions"); // Add under "Actions" group

    },

    onload: function (frm) {
        // Set a query filter for the Item Name field
        frm.set_query('item_name', function () {
            return {
                filters: {
                    item_type: ['in', ['Feed', 'Medicine']] // Only include Feed and Medicine
                }
            };
        });

        // Set a query filter for the Batch dropdown
        frm.set_query('batch', function () {
            return {
                filters: {
                    batch_status: ['!=', 'Completed'] // Exclude Completed batches
                }
            };
        });


    },


    mortality_number_of_birds: function (frm) {
        if (frm.doc.mortality_number_of_birds > 0) {  // Ensure mortality is valid
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Broiler Batch',
                    name: frm.doc.batch // Use the batch identifier from the form
                },
                callback: function (batch_data) {
                    if (batch_data.message && batch_data.message.bird_cost) { // Ensure data exists
                        let cost = parseFloat(batch_data.message.bird_cost);
                        let mcost = parseFloat(frm.doc.mortality_number_of_birds) * cost;
    
                        frm.set_value('mortality_cost', mcost.toFixed(4)); // Store as number
                        frm.trigger('calculate_production_cost'); // Trigger production cost calculation
                    } else {
                        frappe.msgprint(__('Bird Cost not found for the selected batch.'));
                    }
                }
            });
        } else {
            frm.set_value('mortality_cost', 0); // Reset cost if mortality is empty
        }
    },
    

    item_name: function (frm) {
        // Recalculate feed cost when item changes
        if (frm.doc.transaction_date) {
            frm.trigger('transaction_date');

            // Fetch standard consumption from Std Chart based on item name and age

            if (frm.doc.item_name && frm.doc.batch_age_in_days >= 0) {
                frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'Standard Chart',
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

        console.log("Placement date", frm.doc.batch_placed_on);
        console.log(frm.doc.transaction_date);

        // Get and standardize both dates
        let placementDate = new Date(frm.doc.batch_placed_on);
        let transactionDate = new Date(frm.doc.transaction_date);

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
                doctype: 'Item Rate',
                filters: {

                    item_type: frm.doc.item_type, // Match the item type
                    item_name: frm.doc.item_name,
                    date: ['<=', frm.doc.transaction_date] // Fetch rates up to the transaction date
                },
                fields: ['rate', 'date', 'item_name'],
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
                    // frappe.msgprint(__('No rate found for the selected item and date.'));
                    frm.set_value('feed_cost', 0);
                }
            }
        });




    },

    feed_consumed_quantity: function (frm) {


        frm.trigger('calculate_production_cost');
        
    },

    calculate_production_cost: function(frm) {
        if (frm.doc.item_type === "Feed") {
            frm.trigger('transaction_date');

            // Ensure all required fields have values
            if (!frm.doc.feed_consumed_quantity || !frm.doc.average_bird_weight_in_grams || !frm.doc.mortality_number_of_birds) {
                frappe.msgprint(__('Please fill in all required fields: Feed Consumed Quantity, Average Bird Weight, and Mortality.'));
                return;
            }

            // Convert grams to kg for weight calculation
            let avg_weight_kg = frm.doc.average_bird_weight_in_grams / 1000; // Convert to kg
            let total_feed_kg = frm.doc.feed_consumed_quantity; // Assuming it's already in kg
            let total_birds = frm.doc.batch_live_quantity - (frm.doc.mortality_number_of_birds || 0); // Exclude mortality

            // Ensure valid values before FCR calculation
            if (total_birds > 0 && avg_weight_kg > 0) {
                let fcr = (total_feed_kg / (avg_weight_kg * total_birds)).toFixed(3);
                frm.set_value('fcr', fcr);
            } else {
                frappe.msgprint(__('Invalid values: Live Quantity or Average Bird Weight must be greater than 0 for FCR calculation.'));
                return;
            }

            // Fetch required rates from Broiler Batch
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Broiler Batch",
                    filters: { name: frm.doc.batch },
                    fieldname: ["feed_rate", "rate", "medicine_rate"]
                },
                callback: function (r) {
                    if (r.message) {
                        let feed_rate = r.message.feed_rate;
                        let medicine_rate = r.message.medicine_rate;
                        let rate = r.message.rate;

                        // Calculate live quantity after mortality
                        let live_q = frm.doc.batch_live_quantity - frm.doc.mortality_number_of_birds;

                        // Convert body weight from grams to kg
                        let body_weight_kg = frm.doc.average_bird_weight_in_grams / 1000;

                        // Prevent division by zero error
                        if (live_q > 0 && body_weight_kg > 0) {
                            let production_cost = (
                                (frm.doc.batch_placed_quantity * rate) +
                                (frm.doc.feed_consumed_quantity * feed_rate)
                            ) / (live_q * body_weight_kg);

                            // Set the calculated production cost
                            frm.set_value('production_cost', production_cost.toFixed(2));
                        } else {
                            frappe.msgprint(__('Live Quantity or Body Weight is invalid for Production Cost calculation.'));
                        }
                    } else {
                        frappe.msgprint(__('Unable to fetch rates from Broiler Batch.'));
                    }
                }
            });
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

        console.log("transaction_date", transaction_date);
        console.log("batch_placed_on", batch_placed_on);

        // Transaction Date must be >= Batch Placed On
        if (transaction_date < batch_placed_on) {
            frappe.msgprint(__('Transaction Date must be greater than or equal to Batch Placed On'));
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
        frm.trigger('calculate_production_cost');


    },

    batch: function (frm) {

        // Fetch the batch status and ready_for_sale fields
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: "Broiler Batch",  // Target Doctype
                filters: { name: frm.doc.batch },  // Match the batch name
                fieldname: ["batch_status"]  // Fetch these fields
            },
            callback: function (res) {
                if (res.message) {
                    let batch_status = res.message.batch_status;


                    // Check if batch is marked as Ready for Sale
                    if (batch_status === "Ready for sale") {
                        // Make batch_status field visible
                        frm.set_value("batch_status", batch_status);
                        frm.refresh_field("batch_status");

                        // Hide the "Mark as Ready for Sale" button
                        // frm.page.clear_custom_actions();
                        frm.remove_custom_button("Mark as Ready for Sale", "Actions");
                    } else {
                        // Normal transaction: Show both buttons
                        if (!frm.custom_buttons || !frm.custom_buttons["Mark as Ready for Sale"]) {
                            frm.add_custom_button(__('Mark as Ready for Sale'), () => {
                                frappe.confirm(
                                    'Are you sure you want to mark this batch as ready for sale? This action cannot be undone.',
                                    () => {
                                        frappe.call({
                                            method: 'wh_poultryos.poultryos.doctype.broiler_batch.broiler_batch.update_batch_ready_for_sale',
                                            args: {
                                                batch_name: frm.doc.batch,
                                                status: "Ready for sale"
                                            },
                                            callback: function (r) {
                                                if (r.message.status === "success") {
                                                    frappe.msgprint(__('Batch status updated successfully.'));
                                                    frm.set_value("batch_status", "Ready for Sale");
                                                    frm.set_df_property("batch_status", "hidden", 0);
                                                    frm.set_df_property("batch_status", "read_only", 1);
                                                    frm.refresh_field("batch_status");

                                                    // Hide the button after updating status
                                                    frm.remove_custom_button("Mark as Ready for Sale");
                                                } else {
                                                    frappe.msgprint(__('Error updating batch status.'));
                                                }
                                            }
                                        });
                                    }
                                );
                            }, "Actions");
                        }
                    }
                }
            }
        });


        // Set the max date for the Transaction Date field to today
        frm.fields_dict['transaction_date'].df['max'] = frappe.datetime.get_today();
        frm.fields_dict['transaction_date'].refresh(); // Refresh to apply the change

        if (frm.doc.batch) {
            // Fetch the opening date from the Batch Doctype
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'Broiler Batch',
                    fieldname: 'opening_date',
                    filters: { name: frm.doc.batch }
                },
                callback: function (response) {
                    if (response.message && Object.keys(response.message).length > 0) {
                        let opening_date = response.message.opening_date;
                        if (opening_date) {
                            let dt_opening_date = new Date(opening_date);
                            // Convert the date to user-preferred format
                            frm.set_value('batch_placed_on', dt_opening_date);

                            // Fetch the last transaction date for the same batch
                            frappe.call({
                                method: 'frappe.client.get_list',
                                args: {
                                    doctype: 'Broiler Daily Transaction',
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
                                        frm.set_value('transaction_date', frm.doc.batch_placed_on);
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

    before_save: async function (frm) {

        if (frm.doc.batch_placed_on) {
            let date = new Date(frm.doc.batch_placed_on);
            let formatted_date = date.toISOString().split('T')[0]; // Converts to "YYYY-MM-DD"

            frm.set_value('batch_placed_on', formatted_date);
        }





    },

    after_save: async function (frm) {

        let mortality_number_of_birds = frm.doc.mortality_number_of_birds;


        // Get the batch data to update the live birds count, using frm.doc.batch as identifier
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Broiler Batch',
                name: frm.doc.batch  // Use the batch identifier from the form
            },
            callback: function (batch_data) {

                if (batch_data && batch_data.message.live_quantity_number_of_birds !== undefined) {
                    let batch_placed_quantity = batch_data.message.place_quantity_number_of_birds;
                    let current_batch_live_quantity = batch_data.message.live_quantity_number_of_birds;
                    let salequantity = batch_data.message.sale_quantity;
                    // Fetch all transactions related to the batch to calculate total mortality
                    frappe.call({
                        method: 'frappe.client.get_list',
                        args: {
                            doctype: 'Broiler Daily Transaction',
                            filters: { 'batch': frm.doc.batch },  // Filter transactions by batch
                            fields: ['mortality_number_of_birds', 'feed_consumed_quantity', 'culls', 'feed_cost'],
                            order_by: 'transaction_date asc',  // Order transactions by date (ascending)
                        },
                        callback: function (transactions) {

                            if (transactions && transactions.message) {
                                // Calculate the total mortality from all transactions
                                let total_mortality = 0;
                                let culls = 0;
                                let total_feed_cost = 0;
                                let avgweight = frm.doc.average_bird_weight_in_kg;

                                transactions.message.forEach(function (transaction) {
                                    total_feed_cost += parseFloat(transaction.feed_cost) || 0;
                                });

                                transactions.message.forEach(function (transaction) {
                                    total_mortality += transaction.mortality_number_of_birds || 0;
                                });
                                console.log(batch_placed_quantity);
                                console.log(total_mortality);

                                let feedtotal = 0;
                                transactions.message.forEach(function (transaction) {
                                    feedtotal += transaction.feed_consumed_quantity || 0;
                                });

                                transactions.message.forEach(function (transaction) {
                                    culls += transaction.culls || 0;
                                });

                                // Deduct the total mortality from the batch placed quantity
                                let updated_batch_live_quantity = batch_placed_quantity - total_mortality - culls - salequantity;

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
                                            doctype: 'Broiler Batch',
                                            name: frm.doc.batch,
                                            // fieldname: 'live_quantity_number_of_birds',
                                            // value: updated_batch_live_quantity

                                            fieldname: {
                                                live_quantity_number_of_birds: updated_batch_live_quantity,
                                                total_feed: feedtotal,
                                                culls: culls,
                                                total_feed_cost: total_feed_cost,
                                                body_weight: avgweight
                                            }
                                        },
                                        callback: function () {

                                            if (frm.doc.transaction_date) {

                                                frappe.call({
                                                    method: 'frappe.client.get',
                                                    args: {
                                                        doctype: 'Broiler Batch',
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
                                                                // let formatted_live_batch_date = frappe.datetime.str_to_user(live_batch_date);

                                                                // Calculate Mortality
                                                                let mortality = 0;
                                                                let culls2 = 0;
                                                                if (placed_quantity && updated_batch_live_quantity !== undefined) {
                                                                    mortality = placed_quantity - updated_batch_live_quantity - salequantity - culls;
                                                                    culls2 = culls;
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
                                                                        doctype: 'Broiler Batch',
                                                                        name: frm.doc.batch,
                                                                        fieldname: {
                                                                            live_batch_date: live_batch_date,
                                                                            batch_age_in_days: age_in_days,
                                                                            mortality: mortality,
                                                                            culls: culls2,
                                                                            biological_value: updated_biological_value,
                                                                            bird_cost: parseFloat(bird_cost) // Ensure it remains a numeric value
                                                                        }
                                                                    },
                                                                    callback: function () {

                                                                        frappe.msgprint(__('Batch updated successfully with live batch date and age in days.'));

                                                                        console.log("Batch age in days", frm.doc.batch_age_in_days);

                                                                        frappe.call({
                                                                            method: 'wh_poultryos.poultryos.doctype.broiler_daily_transaction.broiler_daily_transaction.get_first_week_mortality',
                                                                            args: {
                                                                                batch_name: frm.doc.batch
                                                                            },
                                                                            callback: function (r) {
                                                                                if (r.message) {

                                                                                    let mor = r.message;
                                                                                    frappe.call({
                                                                                        method: 'frappe.client.set_value',
                                                                                        args: {
                                                                                            doctype: 'Broiler Batch',
                                                                                            name: frm.doc.batch,
                                                                                            fieldname: {
                                                                                                first_week_mortality: mor,

                                                                                            }
                                                                                        },
                                                                                        callback: function () {
                                                                                            console.log(__('First week mortality calculated.'));
                                                                                        }
                                                                                    })

                                                                                } else {

                                                                                }
                                                                            }
                                                                        });

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

        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.broiler_daily_transaction.broiler_daily_transaction.update_batch_status',
            args: {
                batch: frm.doc.batch  // Ensure 'batch' exists in the document
            },
            callback: function (r) {
                if (r.message.status === "success") {
                    frappe.msgprint(__('Batch status updated successfully.'));
                } else {

                }
            }
        });

        let batch_age_in_days = frm.doc.batch_age_in_days;
        let average_bird_weight_in_kg = frm.doc.average_bird_weight_in_kg;

        // Only proceed if conditions are met
        if (batch_age_in_days >= 15 || average_bird_weight_in_kg >= 1.5) {
            try {
                // Check if the settings are available
                await checkBroilerBirdSaleSettings();

                // Fetch the Broiler Bird Sale Settings
                let settings = await fetchBroilerBirdSaleSettings();
                let enable_ideal_age_for_selling_birds = settings.enable_ideal_age_for_selling_birds;
                let enable_ideal_average_weight_for_selling_birds = settings.enable_ideal_average_weight_for_selling_birds;
                let ideal_age_for_selling_birds = settings.ideal_age_for_selling_birds;
                let ideal_weight_for_selling_birds = settings.ideal_weight_for_selling_birds;

                // Check for ideal age for selling birds
                if (enable_ideal_age_for_selling_birds && batch_age_in_days >= ideal_age_for_selling_birds) {
                    await updateBatchStatus(frm, 'Ready for Sale');
                }

                // Check for ideal average weight for selling birds
                if (enable_ideal_average_weight_for_selling_birds && average_bird_weight_in_kg >= ideal_weight_for_selling_birds) {
                    await updateBatchStatus(frm, 'Ready for Sale');
                }

            } catch (error) {
                console.error(error);
            }
        }

    }

});

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
};

async function checkBroilerBirdSaleSettings() {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'frappe.client.get_count',
            args: { doctype: 'Broiler Bird Sale Settings' },
            callback: function (response) {
                if (response.message === 0) {
                    showSettingsNotification();
                    reject("No Broiler Bird Sale Settings found");
                } else {
                    resolve();
                }
            }
        });
    });
}

function showSettingsNotification() {
    frappe.msgprint({
        message: __('Please enable Ideal Age and/or Ideal Average Weight for Selling Birds from Broiler Bird Sale Settings.') +
            '<br><br>' +
            __('Click here to create a new record.') + ': ' +
            '<a href="#" onclick="frappe.new_doc(\'Broiler Bird Sale Settings\')">' + __('Create New Record') + '</a>',
        title: __('Configuration Needed'),
        indicator: 'orange'
    });
}

async function fetchBroilerBirdSaleSettings() {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Broiler Bird Sale Settings',
                fields: ['enable_ideal_age_for_selling_birds', 'enable_ideal_average_weight_for_selling_birds', 'ideal_age_for_selling_birds', 'ideal_weight_for_selling_birds'],
                limit_page_length: 1
            },
            callback: function (result) {
                if (result.message && result.message.length > 0) {
                    resolve(result.message[0]);
                } else {
                    reject("No settings found");
                }
            }
        });
    });
}

async function updateBatchStatus(frm, status) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.broiler_batch.broiler_batch.update_batch_status',
            args: {
                batch_name: frm.doc.batch,
                status: status
            },
            callback: function (r) {
                if (r.message.status === "success") {
                    frappe.msgprint(__('This Batch has been ready for sale.'));
                    resolve();
                } else {
                    reject("Failed to update batch status");
                }
            }
        });
    });
}