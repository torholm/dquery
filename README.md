# dquery

**Do not use this is production just yet -- its API is in an infant state currently and badly needs to get more stabilized**

## Introduction

**dquery** is supposed to be a useful tool for handling dates and times.

The basic requirement is to have an extended javascript `Date` object.
Unfortunately, you can't just simply copy `Date.prototype`, like jQuery does with
`Array.prototype`. So, we lose a bit of performance when we call `dquery()`.
The method simply creates a new `Date` object, and then sticks a bunch of methods
onto it. The end result is a `Date` object that you can use just like an ordinary
`Date` instance, but with more functionality.

### Features

#### Unobtrusive

**dquery** doesn't pollute anything, except that it adds an object to window (`dquery` of course).
**A warning, though**: if you use libraries that break Date's normal behaviour, 
dquery will probably not work properly.

#### Chaining

Most methods on dquery objects are chained, i.e. they return the object that was
modified.

Example:

```javascript
dquery().addDays(4).set({ hours: 20 });
```

### Some of the stuff you can do

Deal with a normal Date object:

```javascript
var date = new Date();
/* ... */
var yay = dquery(date);
```

Is the date in the dquery object in the future?

```javascript
var something = dquery();
/* ... */
if (something > new Date) {
    dqueryIsTheFuture();
}
```

Add 4 years:

```javascript
dquery("5/21/2011").addYears(4).toString()
// Thu May 21 2015 00:00:00 GMT+0200 (CEST)
```

Reset time to 00:00:00:

```javascript
dquery().resetTime().toString()
// Sat May 21 2011 00:00:00 GMT+0200 (CEST)
```

Iterate all days of this month:

```javascript
dquery.iterate( 
    "days", 
    dquery().firstDayOfMonth(),
    dquery().lastDayOfMonth(),
function( date ) {
    /* date parameter above is a dquery object */
});
```

Format date and time:

```javascript
dquery("5/12/2011").format("yyyy-mm-dd");
// 2011-05-12
```

```javascript
dquery("5/12/2011 14:50").format("m/d/yy hh:MM");
// 5/12/11 14:50
```

```javascript
dquery("5/12/2011 00:00").format("ha");
// 12am
```

```javascript
dquery("5/12/2011 12:00").format("ha");
// 12pm
```
