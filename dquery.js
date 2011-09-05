;(function(exports) {
var dateproto = Date.prototype,
    addDates = [
        { get: dateproto.getDate, set: dateproto.setDate, name: "days" },
        { get: dateproto.getMonth, set: dateproto.setMonth, name: "months" },
        { get: dateproto.getFullYear, set: dateproto.setFullYear, name: "years" },
        { get: dateproto.getHours, set: dateproto.setHours, name: "hours" },
        { get: dateproto.getMinutes, set: dateproto.setMinutes, name: "minutes" },
        { get: dateproto.getSeconds, set: dateproto.setSeconds, name: "seconds" }
    ],
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
    if( fmt instanceof Date || typeof fmt == "number" ) {
        date = new Date( fmt );
    } else if( typeof fmt == "string" ) {
        date = dquery.parse( fmt );
    } else {
        date = new Date();
    }
    if( !date || /Invalid/.test(date + "") )
        throw new Error("Invalid date");

    return dquery.extend(date, dquery.methods);
}

dquery.methods = {
    add: function( value ) {
        var ret = {},
            self = this;
        if( value === undefined )
            value = 1;
        dquery.each( addDates, function( fn ) {
            ret[ fn.name ] = function() {
                fn.set.apply( self, [ fn.get.apply( self ) + value ] );
                return self;
            }
        });
        ret.weeks = function() {
            return self.add( value * 7 ).days();
        }
        return ret;
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
        return this.add(1).months()
                   .set("date", 0);
    },

    firstDayOfMonth: function() {
        return this.set("date", 1);
    },

    format: function( fmt ) {
        var self = this;
        return fmt.replace(/((d+){1,4}|(m+){1,4}|yy(?:yy)?|HH?|ss?|MM?|hh?|a)/g, function( _, k ) {
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
        return this.sameDate( dquery( cmp || new Date ).add(-1).days() );
    },

    isTomorrow: function( cmp ) {
        return this.sameDate( dquery( cmp || new Date ).add(1).days() );
    },

    /**
     * Uses ISO 8601.
     * http://en.wikipedia.org/wiki/ISO_8601#Week_dates
     * First week of every year is the week that contains 4 Jan.
     */
    getWeek: function() {
        var oneWeekMs = 7 * 24 * 60 * 60 * 1000;

        var date = dquery( this ).resetTime();

        var firstMonday = dquery( this )
                            .resetTime()
                            .firstDayOfYear()
                            .set("date", 4);
        var firstMondayNextYear = dquery( firstMonday ).add(1).years();

        firstMonday.add( -((firstMonday.getDay() + 6) % 7) ).days();
        firstMondayNextYear.add( -((firstMondayNextYear.getDay() + 6) % 7) ).days();
        if( firstMondayNextYear <= date ) {
            return 1;
        } else if( date < firstMonday ) {
            var yearBefore = dquery( this )
                                .resetTime()
                                .firstDayOfYear()
                                .set("date", 4)
                                .add(-1).years();
            return Math.floor( (date - yearBefore) / oneWeekMs ) + 1;
        } else if ( date < dquery( firstMonday ).add(7).days() ) {
            return 1;
        } else {
            return Math.floor( (date - firstMonday) / oneWeekMs) + 1;
        }
    },

    firstWeek: function() {
        return this.prev().monday(true)
                   .add(-this.getWeek() + 1).weeks();
    },

    prev: function() {
        var self = this;
        function prevDay(offset, day) {
            return function(prevOnSame) {
                if( prevOnSame === true && day == self.getDay() )
                    return self;
                return self.add(-((self.getDay() + offset) % 7 + 1)).days();
            }
        }
        return {
            monday: prevDay(5, 1),
            tuesday: prevDay(4, 2),
            wednesday: prevDay(3, 3),
            thursday: prevDay(2, 4),
            friday: prevDay(1, 5),
            saturday: prevDay(0, 6),
            sunday: prevDay(6, 0)
        }
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
        metric = options.metric,
        step = options.step || 1,
        filter = options.filter,
        idx = 0;
    while( start <= stop ) {
        if( !filter || filter(start, idx) ) {
            callback( start, idx );
        }
        idx++;
        start = start.clone().add(step)[ metric ]();
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
            var o = {};
            dquery.each(mapIndex, function(s, idx) {
                o[ s ] = m[ idx ];
            });
            var fmt = "";
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
            var f = dquery( new Date(fmt) );
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
}

exports.dquery = dquery;
})(typeof exports == "undefined" && window || exports);
