frappe.provide('wh_poultryos.session_handler');

wh_poultryos.session_handler = {
    set_org: function () {
        frappe.call({
            method: 'wh_poultryos.wh_poultryos.session_setter.set_org_name_in_session',
            callback: function (r) {
                if (r.message && r.message.success) {
                    frappe.show_alert({
                        message: __('Organization set successfully'),
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: __(r.message.message || 'Failed to set organization'),
                        indicator: 'red'
                    });
                }
            }
        });
    },

    get_org: function () {
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'wh_poultryos.wh_poultryos.session_getter.get_org_name_from_session',
                callback: function (r) {
                    if (r.message && r.message.success) {
                        resolve(r.message.org_name);
                    } else {
                        reject(r.message.message || 'Failed to get organization');
                    }
                }
            });
        });
    }
};
