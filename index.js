const sqlite3 = require('sqlite3').verbose()
const express = require('express')
const axios = require('axios').default
var cors = require('cors')
const app = express()

const vkAPI = require('./vkapi')
const port = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const db = new sqlite3.Database('./db.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message)
  console.log('connection successfull')
})

const insertDBDataMembers = async (data, group_id) => {
  await data.forEach(async (member) => {
    const sql = `INSERT INTO members(id,sex,byear, group_id) VALUES(?,?,?,?);`
    db.run(sql, [member.id, member.sex, member.byear, Number(group_id)], (err) => {
      if (err) return console.error(err.message)
      console.log('A new row has been created')
    })
  })
}
app.get('/getDBMembersId', async (req, res) => {
  const group_id = req.query.group_id
  let sql = `SELECT id from members where group_id= ? ;`

  await db.all(sql, [Number(group_id)], (err, rows) => {
    if (err) return console.error(err.message)
    res.send(rows)
  })
})

app.post('/getDBMembers', async (req, res) => {
  const ids = JSON.parse(req.body.ids)?.join(',') || []
  let sql = `SELECT * FROM members WHERE id in(${ids});`

  await db.all(sql, (err, rows) => {
    if (err) return console.error(err.message)
    res.send(rows)
  })
})

app.get('/getGroupMembers', async (req, res) => {
  const dbIds = async (group_id) => {
    return await axios.get(`http://localhost:3001/getDBMembersId?group_id=${group_id}`).then((res) => {
      return res.data
    })
  }
  const dbMembers = async (membersId) => {
    return await axios.post(`http://localhost:3001/getDBMembers`, { ids: JSON.stringify(membersId) }).then((res) => {
      return res.data
    })
  }
  let status = ''
  let calculatedData = {
    group_name: '',
    sex: { male: 0, female: 0 },
    age: {
      old: 0,
      teenagers: 0,
      child: 0,
      adult: 0,
      notSpecified: 0
    }
  }
  let data = []
  let sorteredNewGroupDataMembers = []
  let newGroupDataMembers = []
  const { totalCount, group_name, id: convertedId } = await vkAPI.getGroupData(req.query.group_id)
  if (!totalCount && !group_name && !convertedId) {
    calculatedData.group_name = 'Не существует'
    res.send(calculatedData)
  }
  const idData = await vkAPI.getMembersIdData(totalCount, convertedId)
  calculatedData.group_name = group_name || 'Безымянный'
  const dbDataId = (await dbIds(convertedId)).map((el) => el.id)
  if (dbDataId.length !== 0) {
    const undefindedIds = idData.filter((id) => dbDataId.indexOf(id) < 0)
    const extra = dbDataId.filter((id) => idData.indexOf(id) < 0)
    if (undefindedIds.length !== 0) {
      newGroupDataMembers = await vkAPI.getUsersData(undefindedIds)
      sorteredNewGroupDataMembers = newGroupDataMembers.map((el) => {
        let age = null
        if (el.bdate) {
          if (el.bdate.split('.')[2]) {
            age = el.bdate.split('.')[2]
          }
        }
        return {
          id: el.id,
          group_id: convertedId,
          sex: el.sex,
          byear: age
        }
      })
    }
    const newIdsData = dbDataId.filter((id) => extra.indexOf(id) < 0)
    const dbMembersBD = await dbMembers(newIdsData)
    data = [...dbMembersBD, ...sorteredNewGroupDataMembers]
    if (newGroupDataMembers.length !== 0) {
      await insertDBDataMembers(newGroupDataMembers, convertedId)
    }
  } else {
    data = await vkAPI.getUsersData(idData)
    data = data.map((member) => {
      let age = null
      if (member.bdate) {
        if (member.bdate.split('.')[2]) {
          age = member.bdate.split('.')[2]
        }
      }
      return {
        id: member.id,
        group_id: convertedId,
        sex: member.sex,
        byear: age
      }
    })
    await insertDBDataMembers(data, convertedId)
  }

  data.map((member) => {
    const age = new Date().getFullYear() - member.byear
    calculatedData.sex[member.sex === 1 ? 'female' : 'male']++
    if (age) {
      if (age <= 11) {
        calculatedData.age.child++
      }
      if (age >= 60) {
        calculatedData.age.old++
      }
      if (age >= 12 && age < 18) {
        calculatedData.age.teenagers++
      }
      if (age >= 18 && age < 60) {
        calculatedData.age.adult++
      }
    } else {
      calculatedData.age.notSpecified++
    }
  })
  res.send(calculatedData)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
