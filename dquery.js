;(function(exports) {
function capitalize(str) {
    return str.toLowerCase().replace(/^(\w)/, function(_, f) {
        return f.toUpperCase()
    });
}

function prefix(prefix, len, str) {
    if (typeof str == 'undefined' || typeof prefix == 'undefined') {
        return str;
    }
    str = String(str);
    while (str.length < len) {
        str = prefix + str;
    }
    return str;
}

/* Constructs dquery object */
function dquery(fmt) {
    var date;

    if (fmt instanceof Date || typeof fmt == "number") {
        date = new Date(fmt);
    } else if (typeof fmt == "string") {
        date = dquery.parse(fmt);
    } else {
        date = new Date();
    }

    if (!date || /Invalid/.test(String(date))) {
        throw new Error("Invalid date " + date);
    }

    return dquery.extend(date, dquery.methods);
}

function dayIndex(day) {
    if (typeof day == "number") {
        return Math.abs(day % 7);
    }
    return $d.index(capitalize(day), $d.i8n.weekdays);
}

var $d = dquery;

dquery.methods = {
    daysInMonth: function() {
        var date = new Date(this);
        date.setDate(1);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date.getDate();
    },

    addMilliseconds: function(value) {
        this.setTime(this.getTime() + value);
        return this;
    },

    addSeconds: function(value) {
        this.setSeconds(this.getSeconds() + value);
        return this;
    },

    addMinutes: function(value) {
        this.setMinutes(this.getMinutes() + value);
        return this;
    },

    addHours: function(value) {
        this.setHours(this.getHours() + value);
        return this;
    },

    addDays: function(value) {
        return this.addHours(value * 24);
    },

    addWeeks: function(value) {
        return this.addDays(value * 7);
    },

    addMonths: function(value) {
        return this.set("month", this.getMonth() + value);
    },

    addYears: function(value) {
        this.addMonths(value * 12);
        return this;
    },

    resetTime: function() {
        return this.set({ hours: 0, minutes: 0, seconds: 0, ms: 0 });
    },

    resetDate: function() {
        return this.set("date", 1).set("month", 0).set("year", 1970);
    },

    clone: function() {
        return dquery(this);
    },

    set: function(type, value) {
        if (type && value === undefined) {
            for (var prop in type) {
                if (this.set(prop, type[prop]) === undefined) {
                    return undefined;
                }
            }
            return this;
        } else {
            switch(type) {
            case "date":
                return this.setDate(value) && this;
            case "year":
                return this.setFullYear(value) && this;
            case "month":
                var date = this.getDate();
                this.setDate(1);
                this.setMonth(value);
                this.setDate(Math.min(this.daysInMonth(), date));
                return this;
            case "seconds":
                return this.setSeconds(value) && this;
            case "minutes":
                return this.setMinutes(value) && this;
            case "hours":
                return this.setHours(value) && this;
            case "ms":
                return this.setMilliseconds(value) && this;
            }
            return undefined;
        }
    },

    firstDayOfYear: function() {
        return this.set("date", 1)
                   .set("month", 0);
    },

    lastDayOfYear: function() {
        return this.set("month", 12)
                   .set("date", 0);
    },

    lastDayOfMonth: function() {
        return this.addMonths(1)
                   .set("date", 0);
    },

    firstDayOfMonth: function() {
        return this.set("date", 1);
    },

    format: function(format) {
        var self = this;
        var specifiers = /((d+){1,4}|(m+){1,4}|yy(?:yy)?|HH?|ss?|MM?|hh?|a)/g;
        return format.replace(specifiers, function(_, specifier) {
            if (dquery.formatSpecifiers[specifier]) {
                return dquery.formatSpecifiers[specifier].apply(self);
            }
            return specifier;
        });
    },

    sameDate: function(cmp) {
        return this.getDate() == cmp.getDate() 
            && this.getMonth() == cmp.getMonth()
            && this.getFullYear() == cmp.getFullYear();
    },

    isYesterday: function(cmp) {
        return this.sameDate(dquery(cmp || new Date).addDays(-1));
    },

    isTomorrow: function(cmp) {
        return this.sameDate(dquery(cmp || new Date).addDays(1));
    },

    isLeapYear: function() {
        var year = this.getFullYear();
        return (year % 4 == 0 && year % 100 == 0 && year % 400 == 0) 
                || year % 4 == 0;
    },

    /**
     * Uses ISO 8601.
     * http://en.wikipedia.org/wiki/ISO_8601#Week_dates
     * First week of every year is the week that contains 4 Jan.
     */
    getWeek: function() {
        var oneWeekInMillisecs = 7 * 24 * 60 * 60 * 1000;
        var ws = dquery.i8n.weekstart;
        var weekEndIdx = (dayIndex(ws) - 1) % 7;
        var weekEnd = dquery.i8n.weekdays[weekEndIdx];
        var firstWeekContains = (weekEndIdx == 0) ? 4 : 1;
        var n = this.clone().next(weekEnd, { exceptSame: true });

        /* Get first day of first week of year */
        n.set({ month: 0, date: firstWeekContains })
            .prev(ws, { exceptSame: true });

        /* 
         * Go to previous year if start of the first week is
         * older than current date.
         */
        if (this < n) {
            n.addYears(-1).prev(ws, { exceptSame: true });
        }

        return Math.floor((+this - +n) / oneWeekInMillisecs) + 1;
    },

    firstWeek: function() {
        return this.prev("monday", { exceptSame: true })
                   .addWeeks(-this.getWeek() + 1);
    },

    setWeek: function(week) {
        return this.addWeeks(-this.getWeek() + week);
    },

    next: function(day, options) {
        var index = dayIndex(day) % 7;
        if (options && options.exceptSame && index == this.getDay()) {
            return this;
        } else {
            var step = 7 - (7 + this.getDay() - index) % 7;
            return this.addDays(step || 7);
        }
    },

    prev: function(day, options) {
        var index = dayIndex(day) % 7;
        if (options && options.exceptSame && index == this.getDay()) {
            return this;
        } else {
            var step = (this.getDay() + 7 - index) % 7;
            return this.addDays(-step || -7);
        }
    },

    daysOfWeek: function() {
        var list = new dquery.DateList();
        var first = this.clone()
                        .prev(dquery.i8n.weekstart, { exceptSame: true });
        for (var i = 0; i < 7; i++) {
            list.push(first.clone());
            first.addDays(1);
        }
        return list;
    },

    daysOfMonth: function() {
        var list = new dquery.DateList();
        var first = this.clone().firstDayOfMonth();
        dquery.iterate({
            start: first.clone(),
            stop: first.clone().lastDayOfMonth()
        }, function(item) {
            list.push(item);
        });
        return list;
    }
};

dquery.formatSpecifiers = {
    "HH": function() {
        return prefix("0", 2, this.getHours());
    },
    "H": function() {
        return String(this.getHours());
    },
    "h": function() {
        if (this.getHours() % 12 == 0) {
            return "12";
        }
        return this.getHours() % 12;
    },
    "hh": function() {
        if (this.getHours() % 12 == 0) {
            return "12";
        }
        return prefix("0", 2, this.getHours() % 12);
    },
    "M": function() {
        return String(this.getMinutes());
    },
    "MM": function() {
        return prefix("0", 2, this.getMinutes());
    },
    "s": function() {
        return String(this.getSeconds());
    },
    "ss": function() {
        return prefix("0", 2, this.getSeconds());
    },
    "yy": function() {
        return String(this.getFullYear()).substring(2, 4);
    },
    "yyyy": function() {
        return String(this.getFullYear());
    },
    "m": function() {
        return String(this.getMonth() + 1);
    },
    "mm": function() {
        return prefix("0", 2, this.getMonth() + 1);
    },
    "mmm": function() {
        return dquery.i8n.months[this.getMonth()];
    },
    "mmmm": function() {
        return dquery.i8n.months[this.getMonth() + 12];
    },
    "dddd": function() {
        return dquery.i8n.weekdays[this.getDay() + 7];
    },
    "ddd": function() {
        return dquery.i8n.weekdays[this.getDay()];
    },
    "dd": function() {
        return prefix("0", 2, this.getDate());
    },
    "d": function() {
        return String(this.getDate());
    },
    "a": function() {
        return dquery.i8n.ampm[Math.floor(this.getHours() / 12)];
    }
}

dquery.i8n = {};
dquery.i8n.ampm = ["am", "pm"];
dquery.i8n.weekdays = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday"
];
dquery.i8n.weekstart = "monday";
dquery.i8n.months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November",
    "December"
];

/* Utils */
(function() {
    dquery.each = function(list, callback) {
        if ([].forEach) {
            list.forEach(callback);
        } else {
            for (var i = 0, l = list.length; i < l; i++) {
                if (callback(list[i], i) === false) {
                    break;
                }
            }
        }
    }

    dquery.map = function(list, callback) {
        var result = [], index = 0;
        dquery.each(list, function(val) {
            result[result.length] = callback(val, index++);
        });
        return result;
    }

    dquery.extend = function(target, source) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }
        return target;
    }

    dquery.iterate = function(options, callback) {
        var start = dquery(options.start);
        var stop  = dquery(options.stop);
        var metricFn = "add" + capitalize(options.metric || "days");
        var step = options.step || 1;
        var filter = options.filter;
        var index = 0;
        while (start <= stop) {
            if (!filter || filter(start, index)) {
                callback(start.clone(), index);
            }
            index++;
            start[metricFn](step);
        }
    }

    dquery.collect = function(options) {
        var mapped = [];
        dquery.iterate(options, function(val) { 
            mapped[mapped.length] = val; 
        });
        return mapped;
    }

    dquery.diff = function(_start, _end) {
        var start = dquery(_start),
            end = dquery(_end);
        var seconds = ~~((+end - +start) / 1000);
        var minutes = ~~(seconds / 60);
        var hours = ~~(minutes / 60);
        var days = ~~(hours / 24);
        var months = ~~(days / 30); /* approx months. */
        var years = ~~(days / 365);
        return {
            seconds: seconds,
            minutes: minutes,
            hours: hours,
            days: days,
            months: months,
            years: years
        }
    }

    if ([].indexOf) {
        dquery.index = function(elem, list) {
            return list.indexOf(elem);
        }
    } else {
        dquery.index = function(elem, list) {
            for (var i = 0, l = list.length; i < l; i++) {
                if (list[i] === elem) {
                    return i;
                }
            }
            return -1;
        }
    }

    /* Very partial implementation of the original sprintf */
    dquery.sprintf = function(format, args) {
        return format.replace(/\{(\w+)\}/g, function(_, specifier) {
            return String(args[specifier]);
        });
    }
}());

/* Date parsing */
(function() {
    var formats = [
        "{ddd}, {dd} {mmm} {yy} {HH}:{MM}:{ss} {tz}",
        "{mm}/{dd}/{yy}",
        "{mm}/{dd}/{yy} {HH}:{MM}",
        "{mm}/{dd}/{yy} {HH}:{MM}:{ss}",
        "{yy}",
        "{yy}-{mm}",
        "{yy}-{mm}-{dd}",
        "{yy}{mm}{dd}",
        "{yy}-{mm}-{dd} {HH}:{MM}",
        "{yy}-{mm}-{dd} {HH}:{MM}:{ss}",
        "{yy}-{mm}-{dd}T{HH}:{MM}:{ss}{tz}",
        "{yy}-{mm}-{dd}T{HH}:{MM}:{ss}Z"
    ];

    var specifiers = {
        "ddd" : "(" + dquery.i8n.weekdays.join("|") + ")",
        "dd"  : "(\\d?\\d)",
        "mmm" : "(" + dquery.i8n.months.join("|") + ")",
        "mm"  : "(\\d?\\d)" ,
        "yy"  : "(\\d\\d\\d\\d|\\d\\d)",
        "tz"  : "((\w+){2,4}|\\+\\d\\d:?\\d\\d)",
        "HH"  : "(\\d\\d)",
        "MM"  : "(\\d\\d)",
        "ss"  : "(\\d\\d)"
    }

    var defaultFormat = "{mm}/{dd}/{yy} {HH}:{MM}:{ss}{tz}";

    var parseFunctions = dquery.map(formats, function(format) {
        var idents = [""];
        var regexStr = format.replace(/\{(\w+)\}/g, function(_, ident) {
            idents[idents.length] = ident;
            return specifiers[ident];
        });

        var regex = new RegExp("^" + regexStr + "$");

        return function(str) {
            var match;
            var data = {
                dd: "1",
                mm: "1",
                yy: "1970",
                MM: "00",
                HH: "00",
                ss: "00",
                tz: ""
            };
            var formatted;

            if (!(match = regex.exec(str)))
                return undefined;

            for (var i = 1, l = match.length; i < l; i++) {
                var ident = idents[i];
                data[ident] = match[i];
            }

            if (data.monthname) {
                data.month = $d.index(data.monthname, dquery.i8n.months) % 12;
            }

            if (data.year && data.year.length == 2) {
                data.year = "20" + data.year;
            }

            if (data.timezone) {
                data.timezone = data.timezone.replace(":", "");
            }

            formatted = dquery.sprintf(defaultFormat, data);
            return dquery(new Date(formatted));
        }
    });

    dquery.parse = function(str) {
        var parsed;
        for (var i = 0, l = parseFunctions.length; i < l; i++) {
            if (parsed = parseFunctions[i](str)) {
                return parsed;
            }
        }
    };
}());

/* dquery.DateList */
(function() {
    var dateList = dquery.DateList = function() {}
    var proto = dateList.prototype = Array.prototype;

    proto.each = function(callback) {
        dquery.each(this, callback);
    }

    proto.map = function(callback) {
        var list = new dateList;
        list.push.apply(list, dquery.map(this, callback));
        return list;
    }
}());

exports.dquery = dquery;
})(typeof exports == "undefined" && window || exports);
