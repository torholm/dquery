;(function(window) {
var dateProto = Date.prototype,
    addDates = [
        { get: dateProto.getDate, set: dateProto.setDate, name: "days" },
        { get: dateProto.getMonth, set: dateProto.setMonth, name: "months" },
        { get: dateProto.getFullYear, set: dateProto.setFullYear, name: "years" },
        { get: dateProto.getHours, set: dateProto.setHours, name: "hours" },
        { get: dateProto.getMinutes, set: dateProto.setMinutes, name: "minutes" },
        { get: dateProto.getSeconds, set: dateProto.setSeconds, name: "seconds" }
    ],
    capitalize = function(s) {
        return s.replace(/^(\w)/g, function(x) { return x.toUpperCase(); });
    },
    prefix = function( prefix, len, str ) {
        if( !str || !prefix )
            return str;
        str = String( str );
        while( str.length < len )
            str = prefix + str;
        return str;
    };


var dquery = function( fmt ) {
    var date;
    if( fmt ) {
        date = new Date( fmt );
    } else {
        date = new Date();
    }
    if( /Invalid/.test(date + "") )
        return undefined;

    /* copy methods for adding units onto the new date object. */
    dquery.each( addDates, function( fn ) {
        date[ "add" + fn.name ] = function( val ) {
            fn.set.apply( date, [ fn.get.apply( date ) + val ] );
            return date;
        }
    });

    date.add = function( value ) {
        var ret = {},
            self = this;
        if( value === undefined )
            value = 1;
        dquery.each( addDates, function( fn ) {
            ret[ fn.name ] = function() {
                fn.set.apply( self, [ fn.get.apply( date ) + value ] );
                return self;
            }
        });
        return ret;
    }

    date.resetTime = function() {
        return this.set({ hours: 0, minutes: 0, seconds: 0, ms: 0 });
    }

    date.resetDate = function() {
        return this.set("date", 1).set("month", 0).set("year", 1970);
    }

    date.set = function( type, value ) {
        if( type && value === undefined ) {
            for( var prop in type ) {
                if( this.set( prop, type[ prop ] ) === undefined )
                    return undefined;
            }
        } else {
            if( type == "date" )
                this.setDate( value );
            else if( type == "year" )
                this.setFullYear( value );
            else if( type == "month" )
                this.setMonth( value );
            else if( type == "seconds" )
                this.setSeconds( value );
            else if( type == "minutes" )
                this.setMinutes( value );
            else if( type == "hours" )
                this.setHours( value );
            else if( type == "ms" )
                this.setMilliseconds( value );
            else
                return undefined;
        }
        return this;
    }

    date.firstDayOfYear = function() {
        return this.set("date", 1)
                   .set("month", 0);
    }

    date.lastDayOfYear = function() {
        return this.set("month", 12).set("date", 0);
    }

    date.lastDayOfMonth = function() {
        return this.add(1).months().set("date", 0);
    }

    date.firstDayOfMonth = function() {
        return this.set("date", 1);
    }

    date.format = function( fmt ) {
        var self = this;
        return fmt.replace(/((d+){1,4}|(m+){1,4}|yy(?:yy)?|HH?|ss?|MM?|hh?|a)/g, function( _, k ) {
            if( dquery.formatTable[ k ] )
                return dquery.formatTable[ k ].apply( self );
            return "";
        });
    }

    date.sameDate = function( cmp ) {
        return this.getDate() == cmp.getDate() 
            && this.getMonth() == cmp.getMonth()
            && this.getFullYear() == cmp.getFullYear();
    }

    date.isYesterday = function( cmp ) {
        return this.sameDate( dquery( cmp || new Date ).add(-1).days() );
    }

    date.isTomorrow = function( cmp ) {
        return this.sameDate( dquery( cmp || new Date ).add(1).days() );
    }

    /**
     * Uses ISO 8601.
     * http://en.wikipedia.org/wiki/ISO_8601#Week_dates
     * First week of every year is the week that contains 4 Jan.
     */
    date.getWeek = function() {
        var oneDay = 24 * 60 * 60 * 1000;
        var date = dquery( this ).resetTime().firstDayOfYear().set("date", 4);
        var cmp = dquery( this ).resetTime();
        while( date.getDay() != 1 )
            date.setTime( date.getTime() - oneDay );
        var weekMs = 7 * 24 * 60 * 60 * 1000; 
        return Math.ceil((+cmp - +date) / weekMs) || 1;
    }

    return date;
}

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
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];
dquery.i8n["months"] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "January",
    "February",
    "Mars",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
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

dquery.iterate = function( type, _start, _end, callback ) {
    var start = dquery( _start ),
        end = dquery( _end ),
        idx = 0;
    while( start <= end ) {
        callback( start, idx++ );
        start[ "add" ](1)[ type ]();
    }
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

window.dquery = dquery;
})(window);
