;(function(exports) {
var capitalize = function(str) {
        return str.toLowerCase().replace(/^(\w)/, function(_, f) {
            return f.toUpperCase()
        })
    },

    prefix = function( prefix, len, str ) {
        if (typeof str == 'undefined' || typeof prefix == 'undefined') {
            return str;
        }
        str = String( str );
        while( str.length < len ) {
            str = prefix + str;
        }
        return str;
    },
     
    dquery = function( fmt ) {
        var date;
        if( fmt instanceof Date || typeof fmt == "number" ) {
            date = new Date( fmt );
        } else if( typeof fmt == "string" ) {
            date = dquery.parse( fmt );
        } else {
            date = new Date();
        }
        if( !date || /Invalid/.test(date + "") ) {
            throw new Error("Invalid date");
        }

        return dquery.extend(date, dquery.methods);
    },

    dayIndex = function(day) {
        if (typeof day == "number") {
            return Math.abs(day % 7);
        }
        return $d.index( capitalize(day), $d.i8n.weekdays );
    },

    $d = dquery;

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
        return this.addDays( value * 7 );
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

    set: function( type, value ) {
        if( type && value === undefined ) {
            for( var prop in type ) {
                if( this.set( prop, type[ prop ] ) === undefined )
                    return undefined;
            }
        } else {
            switch( type ) {
            case "date":
                return this.setDate( value ) && this;
            case "year":
                return this.setFullYear( value ) && this;
            case "month":
                var date = this.getDate();
                this.setDate( 1 );
                this.setMonth( value );
                this.setDate(Math.min(this.daysInMonth(), date));
                return this;
            case "seconds":
                return this.setSeconds( value ) && this;
            case "minutes":
                return this.setMinutes( value ) && this;
            case "hours":
                return this.setHours( value ) && this;
            case "ms":
                return this.setMilliseconds( value ) && this;
            }
            return undefined;
        }
        return this;
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

    format: function( fmt ) {
        var self = this;
        return fmt.replace(
            /((d+){1,4}|(m+){1,4}|yy(?:yy)?|HH?|ss?|MM?|hh?|a)/g,
        function( _, k ) {
            if( dquery.formatTable[ k ] )
                return dquery.formatTable[ k ].apply( self );
            return "";
        });
    },

    sameDate: function( cmp ) {
        return this.getDate() == cmp.getDate() 
            && this.getMonth() == cmp.getMonth()
            && this.getFullYear() == cmp.getFullYear();
    },

    isYesterday: function( cmp ) {
        return this.sameDate( dquery( cmp || new Date ).addDays(-1) );
    },

    isTomorrow: function( cmp ) {
        return this.sameDate( dquery( cmp || new Date ).addDays(1) );
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
        var firstWeekContains = (weekEndIdx == 0) ? 4 : 1;
        var weekEnd = dquery.i8n.weekdays[ weekEndIdx ];
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
        var idx = dayIndex( day ) % 7;
        if (options && options.exceptSame && idx == this.getDay()) {
            return this;
        } else {
            var step = 7 - (7 + this.getDay() - idx) % 7;
            return this.addDays(step || 7);
        }
    },

    prev: function(day, options) {
        var idx = dayIndex( day ) % 7;
        if (options && options.exceptSame && idx == this.getDay()) {
            return this;
        } else {
            var step = (this.getDay() + 7 - idx) % 7;
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

dquery.formatTable = {
    "HH": function() {
        return prefix( "0", 2, this.getHours());
    },
    "H": function() {
        return String( this.getHours() );
    },
    "h": function() {
        if( this.getHours() % 12 == 0 )
            return "12";
        return this.getHours() % 12;
    },
    "hh": function() {
        if( this.getHours() % 12 == 0 )
            return "12";
        return prefix( "0", 2, this.getHours() % 12 );
    },
    "M": function() {
        return String( this.getMinutes() );
    },
    "MM": function() {
        return prefix( "0", 2, this.getMinutes() );
    },
    "s": function() {
        return String( this.getSeconds() );
    },
    "ss": function() {
        return prefix( "0", 2, this.getSeconds() );
    },
    "yy": function() {
        return String( this.getFullYear()).substring( 2, 4 );
    },
    "yyyy": function() {
        return String( this.getFullYear() );
    },
    "m": function() {
        return String( this.getMonth() + 1 );
    },
    "mm": function() {
        return prefix( "0", 2, this.getMonth() + 1 );
    },
    "mmm": function() {
        return dquery.i8n.months[ this.getMonth() ];
    },
    "mmmm": function() {
        return dquery.i8n.months[ this.getMonth() + 12 ];
    },
    "dddd": function() {
        return dquery.i8n.weekdays[ this.getDay() + 7 ];
    },
    "ddd": function() {
        return dquery.i8n.weekdays[ this.getDay() ];
    },
    "dd": function() {
        return prefix( "0", 2, this.getDate() );
    },
    "d": function() {
        return String( this.getDate() );
    },
    "a": function() {
        return dquery.i8n.ampm[ Math.floor( this.getHours() / 12 ) ];
    }
}

dquery.i8n = {};
dquery.i8n["ampm"] = [ "am", "pm" ];
dquery.i8n["weekdays"] = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday"
];
dquery.i8n.weekstart = "monday";
dquery.i8n["months"] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
    "January", "February", "Mars", "April", "May", "June",
    "July", "August", "September", "October", "November",
    "December"
];

dquery.each = function( list, callback) {
    if( [].forEach ) {
        list.forEach( callback );
    } else {
        for( var i = 0, l = list.length; i < l; i++ ) {
            if( callback( list[i], i ) === false )
                break;
        }
    }
}

dquery.map = function( list, callback ) {
    var a = [], i = 0;
    dquery.each( list, function(val) {
        a[a.length] = callback( val, i++ );
    });
    return a;
}

dquery.extend = function( target, source ) {
    for( var prop in source ) {
        if( source.hasOwnProperty( prop ) ) {
            target[prop] = source[prop];
        }
    }
    return target;
}

dquery.iterate = function( options, callback ) {
    var start = dquery( options.start ),
        stop = dquery( options.stop ),
        metricFn = "add" + capitalize(options.metric || "days"),
        step = options.step || 1,
        filter = options.filter,
        idx = 0;
    while( start <= stop ) {
        if( !filter || filter(start, idx) ) {
            callback( start.clone(), idx );
        }
        idx++;
        start[ metricFn ](step);
    }
}

dquery.collect = function( options ) {
    var ret = [];
    dquery.iterate( options, function(val) { 
        ret[ret.length] = val; 
    });
    return ret;
}

dquery.diff = function( _start, _end ) {
    var start = dquery( _start ),
        end = dquery( _end );
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

dquery.index = function( elem, list ) {
    for (var i = 0, l = list.length; i < l; i++) {
        if (list[i] === elem) {
            return i;
        }
    }
    return -1;
}

/* Date parsing */
var parseFormats = [
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
    //2003-12-31T10:14:55-08:00
    "{yy}-{mm}-{dd}T{HH}:{MM}:{ss}{tz}",
    //2003-12-31T10:14:55Z
    "{yy}-{mm}-{dd}T{HH}:{MM}:{ss}Z"
];

function constructParsable(str) {
    var mapIndex = [""];
    var regexStr = str.replace( /\{(\w+)\}/g, function( _, ident ) {
        if( ident == "ddd" ) {
            mapIndex[mapIndex.length] = "ddd";
            return "(" + dquery.i8n.weekdays.join("|") + ")";
        } else if( ident == "dd" ) {
            mapIndex[mapIndex.length] = "dd";
            return "(\\d?\\d)";
        } else if( ident == "mmm" ) {
            mapIndex[mapIndex.length] = "mmm";
            return "(" + dquery.i8n.months.join("|") + ")";
        } else if( ident == "mm" ) {
            mapIndex[mapIndex.length] = "mm";
            return "(\\d?\\d)";
        } else if( ident == "yy" ) {
            mapIndex[mapIndex.length] = "yy";
            return "(\\d\\d\\d\\d|\\d\\d)";
        } else if( ident == "tz" ) {
            mapIndex[mapIndex.length] = "tz";
            return "((\\w+){2,4}|\\+\\d\\d:?\\d\\d)";
        } else if( ident == "HH" || ident == "MM" || ident == "ss" ) {
            mapIndex[mapIndex.length] = ident;
            return "(\\d\\d)";
        }
    });
    var regex = new RegExp("^" + regexStr + "$");
    return function( str ) {
        var m;
        if( m = regex.exec(str) ) {
            var o = {}, fmt = "", f;
            dquery.each(mapIndex, function(s, idx) {
                o[ s ] = m[ idx ];
            });
            if( o.mm || o.mmm )
                fmt += o.mm || (dquery.i8n.months.indexOf( o.mmm ) + 1) % 12;
            else
                fmt += "1";
            fmt += "/" + o.dd || "1";
            fmt += "/" + (o.yy.length == 2 ? "20" + o.yy : o.yy);
            fmt += " " + (o.HH || "00")
                + ":" + (o.MM || "00")
                + ":" + (o.ss || "00");
            if( o.tz )
                fmt += " " + o.tz.replace(":", "");
            f = dquery( new Date(fmt) );
            return f;
        }
    }
}

var parseTable = dquery.map( parseFormats, function(val) {
    return constructParsable( val );
});

dquery.parse = function( str ) {
    var ret;
    dquery.each( parseTable, function( m ) {
        var res = m( str );
        if( res ) {
            ret = res;
            return false;
        }
    });
    return ret;
};

(function() {
    var dateList = dquery.DateList = function() {
    }

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
