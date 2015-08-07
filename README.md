# ledge [![Build Status](https://secure.travis-ci.org/tnguyen14/ledge.png?branch=master)](http://travis-ci.org/tnguyen14/ledge)

## Documentation

### Merchant count
Each account contains a property that keep track of the merchants used in that account and the number of times each merchant is used.

```json
// account
{
	"name": "foo",
	"merchants_count": {
		"slugified-merchant-name": {
			"count": 5,
			"values": ["Slugified merchant name", "slugified Merchant Name"]
		}
	}
}
```

The `values` array contains variations of the same name after slugified.

## License
Copyright (c) 2014 Tri Nguyen. Licensed under the MIT license.
