incomplete + speedran the programming for this.
<br />
nsfw (petplay themed) bot. be warned lol!
# Muzzle Bot Command Guide

### Commands Overview

1. [`/muzzle`](#1-muzzle)
2. [`/unmuzzle`](#2-unmuzzle)
3. [`/muzzleme`](#3-muzzleme)
4. [`/options`](#4-options)

---

## 1. `/muzzle`

**Description:** Muzzles a user for a specified amount of time.

**Usage:**
```plaintext
/muzzle user:<@User> [time:<minutes>] [type:<muzzle type>]
```

**Parameters:**
- **user:** The user to muzzle (required).
- **time:** The duration of the muzzle in minutes. Default is 1 hour.
- **type:** The type of muzzle. Default is "dog". (**NOT IMPLEMENTED YET!**)

**Permissions:**
- Requires "Manage Messages" permission.

**Example:**
```plaintext
/muzzle user:@puppy time:30 type:cat
```
Muzzles @puppy for 30 minutes with a cat muzzle.

---

## 2. `/unmuzzle`

**Description:** Removes the muzzle from a user.

**Usage:**
```plaintext
/unmuzzle user:<@User>
```

**Parameters:**
- **user:** The user to unmuzzle (required).

**Permissions:**
- Requires "Manage Messages" permission.

**Example:**
```plaintext
/unmuzzle user:@puppy
```
Removes the muzzle from @puppy.

---

## 3. `/muzzleme`

**Description:** Muzzles the user issuing the command for a specified amount of time.

**Usage:**
```plaintext
/muzzleme [time:<minutes>]
```

**Parameters:**
- **time:** The duration of the muzzle in minutes. Default is 1 hour.

**Permissions:**
- Can be used by any user.

**Example:**
```plaintext
/muzzleme time:15
```
Muzzles the user for 15 minutes.

---

## 4. `/options`

**Description:** Configures various muzzle settings.

**Subcommands:**

### `blacklist`
- **Usage:** 
  ```plaintext
  /options blacklist action:<add|remove|clear> word:<word>
  ```
- **Description:** Adds, removes, or clears words from the blacklist.
- **Example:** 
  ```plaintext
  /options blacklist action:add word:badword
  ```

### `whitelist`
- **Usage:** 
  ```plaintext
  /options whitelist action:<add|remove> word:<word>
  ```
- **Description:** Adds or removes words from the whitelist. (**NOT IMPLEMENTED YET!**)
- **Example:** 
  ```plaintext
  /options whitelist action:add word:goodword
  ```

### `censor`
- **Usage:** 
  ```plaintext
  /options censor type:<spoiler|remove|bork>
  ```
- **Description:** Changes the type of censor used.
- **Example:** 
  ```plaintext
  /options censor type:spoiler
  ```

### `type`
- **Usage:** 
  ```plaintext
  /options type type:<dog|cat|horse|wolf|fox|bunny|bird>
  ```
- **Description:** Changes the type of muzzle used. (**NOT IMPLEMENTED YET!**)
- **Example:** 
  ```plaintext
  /options type type:fox
  ```

### `viewconfig`
- **Usage:** 
  ```plaintext
  /options viewconfig
  ```
- **Description:** Views the current muzzle configuration.
- **Example:** 
  ```plaintext
  /options viewconfig
  ```

### `bypass`
- **Usage:** 
  ```plaintext
  /options bypass allow:<true|false>
  ```
- **Description:** Toggles the ability to bypass the muzzle with `{}`.
- **Example:** 
  ```plaintext
  /options bypass allow:true
  ```

**Permissions:**
- Can be used by any user to configure their own settings.
