/* Copyright 2012-2015 Therp
 * Copyright 2016 - Tecnativa - Angel Moya <odoo@tecnativa.com>
 * Copyright 2017 - redO2oo   - Robert Rottermann <robert@redO2oo.ch>
 * Copyright 2018 - Therp BV
 * Copyright 2021 - Sunflower IT
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

odoo.define("support_branding.CrashManager", function (require) {
    "use strict";
    var CrashManager = require("web.CrashManager").CrashManager;
    var session = require("web.session");
    var core = require("web.core");

    var _t = core._t;

    CrashManager.include({
        init: function () {
            var self = this;
            $.when(this._super.apply(this, arguments)).then(function () {
                self._rpc({
                    model: "ir.config_parameter",
                    method: "get_param",
                    args: ["support_company"],
                }).then(function (name) {
                    self.support_cp_name = name;
                });

                self._rpc({
                    model: "ir.config_parameter",
                    method: "get_param",
                    args: ["support_company_url"],
                }).then(function (url) {
                    self.support_cp_url = url;
                });

                self._rpc({
                    model: "ir.config_parameter",
                    method: "get_param",
                    args: ["support_email"],
                }).then(function (email) {
                    self.support_cp_email = email;
                });

                self._rpc({
                    model: "ir.config_parameter",
                    method: "get_param",
                    args: ["support_release"],
                }).then(function (release) {
                    self.support_cp_release = release;
                });

                self._rpc({
                    model: "ir.config_parameter",
                    method: "get_param",
                    args: ["support_branding_color"],
                }).then(function (color) {
                    self.support_cp_color = color;
                });
            });
        },
        show_error: function (error) {
            var self = this;
            var dialog = this._super.apply(this, arguments);
            var subject =
                session.username +
                "@" +
                session.db +
                "[" +
                session.server +
                "]:" +
                error.message;
            var body = error.data.debug;
            var inputs =
                "" +
                '<input type="hidden" name="subject" value=' +
                subject +
                "/>\n" +
                '<input type="hidden" class="sp-body" name="body" value=\'' +
                body +
                "'/>";
            dialog.opened(function () {
                var $form = $(".support-branding-submit-form");
                var $statement = $(".support-statement");
                var $description = $(".support-desc");
                var $button = $(".support-btn");
                var $body = $(".sp-body");
                var $header = $form.parents(".modal-dialog").find(".modal-header");
                var $footer = $form.parents(".modal-dialog").find(".modal-footer");

                $statement.prepend(inputs);
                if (self.support_cp_email) {
                    if (self.support_cp_name) {
                        var title = "Support By " + self.support_cp_name;
                        $('<h3 class="text-primary">' + title + "</h3>").insertBefore(
                            ".support-branding-submit-form"
                        );
                        $button.text(
                            _.str.sprintf(_t("Email to %s"), self.support_cp_name)
                        );
                    }
                    $form.attr("action", "mailto:" + self.support_cp_email);
                    $form
                        .parents(".modal")
                        .find(".modal-body")
                        .css("max-height", "70vh");
                    $button.on("click", function (ev) {
                        var $btn = $(this);
                        if (!$description.val()) {
                            $description.parent().addClass("oe_form_invalid");
                            ev.preventDefault();
                            return;
                        }
                        ev.preventDefault();
                        var desc = $description.val();
                        var params = {
                            state: "outgoing",
                            auto_delete: true,
                            email_to: self.support_cp_email,
                            subject: subject,
                            body_html: jQuery("<div/>")
                                .append(
                                    jQuery("<div/>").text(desc),
                                    jQuery("<pre/>").text(body)
                                )
                                .html(),
                        };
                        self._rpc({
                            model: "mail.mail",
                            method: "create",
                            args: [params],
                        }).then(
                            function (mail_id) {
                                if (mail_id) {
                                    self._rpc({
                                        model: "mail.mail",
                                        method: "send",
                                        args: [mail_id],
                                    }).then(function (res) {
                                        if (res) {
                                            self.do_notify(
                                                "Success",
                                                "Support mail created!"
                                            );
                                        }
                                    });
                                }
                            },
                            function () {
                                $body.val(desc + "\n" + $body.val());
                                $btn.unbind("click");
                                $btn.click();
                            }
                        );
                    });
                } else {
                    $description.css({display: "none"});
                    $button.css({display: "none"});
                }
                $form.prependTo($footer);
                if (self.support_cp_color) {
                    $header.css({background: self.support_cp_color});
                    $footer.css({background: self.support_cp_color});
                } else {
                    $header.css({background: ""});
                    $footer.css({background: ""});
                }
            });
        },
    });
});
