const fs = require('fs')
const crypto = require('crypto')

/**
 * GET db
**/
const _registered = JSON.parse(fs.readFileSync('./storage/bot/registered.json'))
const bane = JSON.parse(fs.readFileSync('./storage/bot/banned.json'))

/**
 * GET random user from db
 * return {string}
**/
const getRegisteredRandomId = () => {
    return _registered[Math.floor(Math.random() * _registered.length)].id
}

/**
 * add user to db
 * @param {String} userId 
 * @param {String} name 
 * @param {String} age 
 * @param {String} serial 
**/
const addRegisteredUser = (userid, name, age, serials) => {
    const obj = { id: userid, name: name, age: age, serial: serials }
    _registered.push(obj)
    fs.writeFileSync('./storage/bot/registered.json', JSON.stringify(_registered))
}

const bannadd = (userid) => {
    const obj = {userid}
    bane.push(obj)
    fs.writeFileSync('./storage/bot/banned.json', JSON.stringify(bane))
}

/**
 * GET random serial
 * params {number} size
 * return {string}
**/
const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size)
}

/**
 * cek user from db
 * params {string} userid
 * return {true/false}
**/
const checkRegisteredUser = (userid) => {
    let status = false
    Object.keys(_registered).forEach((i) => {
        if (_registered[i].id === userid) {
            status = true
        }
    })
    return status
}

const checkban = (userid) => {
    let status = false
    Object.keys(bane).forEach((i) => {
        if (bane[i].id === userid) {
            status = true
        }
    })
    return status
}

module.exports = {
	getRegisteredRandomId,
	addRegisteredUser,
	createSerial,
	checkRegisteredUser,
	checkban,
	bannadd
}