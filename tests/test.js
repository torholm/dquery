module("core");
test("should return undefined when instantiating with nonsense", function() {
    equals(undefined, dquery("nonsense"));
});

test("should instantiate with default date", function() {
    ok(/(\w+){3} (\w+){3}/i.test("" + dquery()));
});

test("should parse date from 1 argument which is string", function() {
    equals("Mon May 16 2011", (dquery("5/16/2011") + "").substring(0, 15));
});

test("should parse date from 1 argument which is int timestamp", function() {
    equals("Mon May 16 2011", (dquery(1305496800000) + "").substring(0, 15));
});


module("reset");
test("should reset time", function() {
    equals("00:00:00", (dquery().resetTime() + "").substring(16, 24));
});

test("should reset date", function() {
    equals("Thu Jan 01 1970", (dquery("5/21/2011").resetDate() + "").substring(0, 15));
});

module("add");
test("should add two days", function() {
    equals("Mon May 23 2011", (dquery("5/21/2011").add(2).days() + "").substring(0, 15));
});

test("should add two months", function() {
    equals("Thu Jul 21 2011", (dquery("5/21/2011").add(2).months() + "").substring(0, 15));
});

test("should add two years", function() {
    equals("Tue May 21 2013", (dquery("5/21/2011").add(2).years() + "").substring(0, 15));
});

test("should add one week", function() {
    //equals(
});

test("should add one hour", function() {
    equals("Sat May 21 2011 13:00:00", (dquery("5/21/2011 12:00").add(1).hours() + "").substring(0, 24));
});

test("should add one minute", function() {
    equals("Sat May 21 2011 12:01:00", (dquery("5/21/2011 12:00").add(1).minutes() + "").substring(0, 24));
});

test("should add one second", function() {
    equals("Sat May 21 2011 12:00:01", (dquery("5/21/2011 12:00").add(1).seconds() + "").substring(0, 24));
});

test("should go to previous day when adding a negative day value", function() {
    equals("Sat May 21 2011", (dquery("5/22/2011").add(-1).days() + "").substring(0, 15));
});


test("should add n months", function() {
    for (var i = 0; i < 5; i++) {
        equals(4 + i, dquery("5/21/2011").add(i).months().getMonth());
    }
});


module("first and last");
test("should add 4 years and get first day of that year", function() {
    equals("Thu Jan 01 2015", (dquery("5/21/2011").add(4).years().firstDayOfYear() + "").substring(0, 15));
});

test("should set last day in month", function() {
    equals("Tue May 31 2011", (dquery("5/21/2011").lastDayOfMonth() + "").substring(0, 15));
});

test("should set first day in month", function() {
    equals("Sun May 01 2011", (dquery("5/21/2011").firstDayOfMonth() + "").substring(0, 15));
});

test("should set first day of year", function() {
    equals("Sat Jan 01 2011", (dquery("5/21/2011").firstDayOfYear() + "").substring(0, 15));
});

test("should set last day of year", function() {
    equals("Sat Dec 31 2011", (dquery("5/21/2011").lastDayOfYear() + "").substring(0, 15));
});


module("set");
test("should set date to 16th of May 2011", function() {
    equals("Mon May 16 2011", (dquery("5/21/2011").set("date", 16) + "").substring(0, 15));
});

test("should set month to june 2011", function() {
    equals("Tue Jun 21 2011", (dquery("5/21/2011").set("month", 5) + "").substring(0, 15));
});

test("should set year to 2010", function() {
    equals("Mon May 21 2012", (dquery("5/21/2011").set("year", 2012) + "").substring(0, 15));
});

test("should return undefined when setting nonsense", function() {
    equals(undefined, dquery().set("nonsense"));
});

test("should set year to 2030", function() {
    equals("Tue May 21 2030", (dquery("5/21/2011").set({ year: 2030 }) + "").substring(0, 15));
});

test("should set time to 12:34:56", function() {
    equals("12:34:56", (dquery("5/21/2011").set({
        hours: 12,
        minutes: 34,
        seconds: 56
    }) + "").substring(16, 24));
});

test("should set millisec to 123", function() {
    equals(123, dquery().set({ ms: 123 }).getMilliseconds());
});


module("functional");
test("should each every date in month", function() {
    var expected = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
        actual = [];
    dquery.iterate("days", dquery("5/1/2011"), dquery("5/31/2011"), function(date) {
        actual.push( date.getDate() );
    });
    equals( String(actual), String(expected) );
});

test("should each hour between dates", function() {
    var expected = [0, 1, 2, 3, 4, 5, 6],
        actual = [];
    dquery.iterate("hours", dquery("5/1/2011"), dquery("5/1/2011 06:00"), function( date ) {
        actual.push( date.getHours() );
    });
    equals( String(expected), String(actual) );
});


module("format");
test("should format date", function() {
    equals("3", dquery("5/3/2011").format("d"), "short numeric date");
    equals("10", dquery("5/10/2011").format("d"), "short numeric date");
    equals("03", dquery("5/3/2011").format("dd"), "long numeric date");
    equals("10", dquery("5/10/2011").format("dd"), "long numeric date");
    equals("Sun", dquery("5/22/2011").format("ddd"), "short textual date");
    equals("Sunday", dquery("5/22/2011").format("dddd"), "long textual date");
});

test("should format month", function() {
    equals("5", dquery("5/3/2011").format("m"), "short numeric month");
    equals("10", dquery("10/3/2011").format("m"), "short numeric month");
    equals("05", dquery("5/3/2011").format("mm"), "long numeric month");
    equals("10", dquery("10/3/2011").format("mm"), "long numeric month");
    equals("Jan", dquery("1/3/2011").format("mmm"), "short textual month");
    equals("January", dquery("1/3/2011").format("mmmm"), "long textual month");
});

test("should format year", function() {
    equals("11", dquery("5/3/2011").format("yy"), "short year");
    equals("2011", dquery("5/3/2011").format("yyyy"), "long year");
});

test("should format minutes", function() {
    equals("4", dquery("5/3/2011 12:04").format("M"), "short minute");
    equals("04", dquery("5/3/2011 12:04").format("MM"), "long minute");
    equals("10", dquery("5/3/2011 12:10").format("MM"), "long minute");
});

test("should format hours 14-hour-clock", function() {
    equals("5", dquery("5/3/2011 05:00").format("H"), "short hour");
    equals("05", dquery("5/3/2011 05:00").format("HH"), "long hour");
    equals("10", dquery("5/3/2011 10:00").format("HH"), "long hour");
});

test("should format hours 12-hour-clock", function() {
    equals("2", dquery("1/1/11 14:00").format("h"), "short hour");
    equals("02", dquery("1/1/11 14:00").format("hh"), "short hour");
    equals("12", dquery("1/1/11 12:00").format("hh"), "short hour");
    equals("11", dquery("1/1/11 11:00").format("hh"), "short hour");
    equals("11", dquery("1/1/11 23:00").format("hh"), "short hour");
});

test("should format seconds", function() {
    equals("7", dquery("1/1/2011 05:00:07").format("s"), "short second");
    equals("07", dquery("1/1/2011 05:00:07").format("ss"), "long second");
    equals("10", dquery("1/1/2011 05:00:10").format("ss"), "long second");
});

test("should format a normal date", function() {
    equals("2011-05-20", dquery("5/20/2011").format("yyyy-mm-dd"));
});

test("should format US with year last", function() {
    equals("5/20/2011", dquery("5/20/2011").format("m/d/yyyy"));
});

test("should format time", function() {
    equals("05:40:35", dquery("1/1/11 05:40:35").format("HH:MM:ss"));
});

test("should format am/pm", function() {
    equals("4pm", dquery("1/1/11 16:20").format("ha"));
    equals("4am", dquery("1/1/11 04:20").format("ha"));
    equals("12pm", dquery("1/1/11 12:20").format("ha"));
    equals("12am", dquery("1/1/11 00:20").format("ha"));
});

test("should format time short", function() {
    equals("1:2:3", dquery("1/1/11 01:02:03").format("H:M:s"));
});


module("comparison");
test("should return proper diff", function() {
    equals(2, dquery.diff( dquery(), dquery().add(2).days() ).days );
    equals(90, dquery.diff( dquery(), dquery().add(90).seconds() ).seconds );
    equals(3, dquery.diff( dquery(), dquery().add(3).years() ).years );
});

test("should determine yesterday, tomorrow, same date", function() {
    strictEqual( true, dquery().add(-1).days().isYesterday() );
    strictEqual( true, dquery("1/1/11").add(-4).days().isYesterday( dquery("1/1/11").add(-3).days() ) );
    strictEqual( true, dquery().add(1).days().isTomorrow() );
    strictEqual( true, dquery("1/1/11").add(4).days().isTomorrow( dquery("1/1/11").add(3).days() ) );
    strictEqual( true, dquery("1/1/11").sameDate( dquery("1/1/11") ) );
});


module("week");
test("should determine correct week", function() {
    equals(48, dquery("11/24/2009").getWeek());
    equals(21, dquery("5/24/2011").getWeek());
    equals(53, dquery("1/3/2010").getWeek());
    equals(1, dquery("12/30/2008").getWeek());
    equals(2, dquery("1/6/2020").getWeek());
    equals(1, dquery("1/5/2020").getWeek());
});

test("should go to first week of year", function() {
    equals("2011-1-3", dquery("1/6/2011").firstWeek().format("yyyy-m-d"));
    equals("2008-12-29", dquery("1/2/2010").firstWeek().format("yyyy-m-d"));
});


module("prev");
test("should go to previous weekdays", function() {
    equals("5-29", dquery("5/30/11").prev().sunday().format("m-d"));
    equals("5-22", dquery("5/29/11").prev().sunday().format("m-d"));
    equals("5-28", dquery("5/30/11").prev().saturday().format("m-d"));
    equals("5-21", dquery("5/28/11").prev().saturday().format("m-d"));
    equals("5-27", dquery("5/28/11").prev().friday().format("m-d"));
    equals("5-20", dquery("5/27/11").prev().friday().format("m-d"));
    equals("5-26", dquery("5/28/11").prev().thursday().format("m-d"));
    equals("5-19", dquery("5/26/11").prev().thursday().format("m-d"));
    equals("5-25", dquery("5/28/11").prev().wednesday().format("m-d"));
    equals("5-18", dquery("5/25/11").prev().wednesday().format("m-d"));
    equals("5-24", dquery("5/28/11").prev().tuesday().format("m-d"));
    equals("5-17", dquery("5/24/11").prev().tuesday().format("m-d"));
    equals("5-23", dquery("5/28/11").prev().monday().format("m-d"));
    equals("5-16", dquery("5/23/11").prev().monday().format("m-d"));
});

test("shouldn't change when sending `true` to prev().tuesday() with same weekday", function() {
    equals("5-31", dquery("5/31/11").prev().tuesday( true ).format("m-d"));
});
