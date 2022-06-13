const mysql = require('mysql')
const {stringify} = require('flatted');

const conn = mysql.createConnection({
  socketPath: '/var/run/mysqld/mysqld.sock',
  user: 'c58620_ildarum1_web_na4u_ru',
  database: 'c58620_ildarum1_web_na4u_ru',
  password: 'MiQtaTuqzocuz93'
  })

const init = async()=>{
    await conn.connect((err) => {
    if (err) {
      console.log(err)
      return err
    }
  })
}
const disconnect = async()=>{
    await conn.end()
}

const getDBMembersData = async (group_id) => {
  let ricieveDBData
  let query = `SELECT * from members where group_id=${group_id};`
  await conn.query(query, (err, result) => {
    if (result) {
      ricieveDBData = result
    }
  })
  return ricieveDBData
}

const insertDBDataMembers = async (data,group_id) => {
  await data.forEach(async(member)=>{
    const sql = `INSERT INTO members(id, group_id,sex,bdate) VALUES(${member.id},${group_id},${member.sex},${member.bdate ?  `'${member.bdate}'`: null });`
    await conn.query(sql, function (err, results) {}) 
  })
}

const getDBMembersId = async (group_id,callback) => {
  let sql = `SELECT * from members;`
  await conn.query(sql, (err, result) => {
    if(err){
    console.log("err")
    }else{
     callback(result)
    }
  })
}



const removeDataFromDB = async (id) => {
  let error = "all right"
  const sql = `DELETE FROM members WHERE id=${id};`
  await conn.query(sql, function (err, results) {error=error+err})
  return error;
}
module.exports.disconnect = disconnect
module.exports.getDBMembersData = getDBMembersData
module.exports.init = init
module.exports.getDBMembersId = getDBMembersId
module.exports.removeDataFromDB = removeDataFromDB
module.exports.insertDBDataMembers = insertDBDataMembers
