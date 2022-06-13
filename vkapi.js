const axios = require('axios').default

// Информация о группе
const getGroupData = async (group_id) => {
  const recieveData = { totalCount: 0, group_name: '', id: 0 }
  await axios
    .get(
      `https://api.vk.com/method/groups.getById?group_id=${group_id}&fields=members_count,id&access_token=1db9d62a1db9d62a1db9d62a001dc5e46211db91db9d62a7fe300f1402520f55447d220&v=5.81`
    )
    .then(function (response) {
      recieveData.totalCount = response.data.response[0].members_count
      recieveData.group_name = response.data.response[0].name
      recieveData.id = response.data.response[0].id
    })
    .catch(function (error) {
      console.log(error)
    })
  return recieveData
}

// Информация по новым юзерам
const getUsersData = async (ids) => {
  let usersData = []
  await axios
    .get(
      `https://api.vk.com/method/users.get?user_ids=${ids.join()}&&fields=sex,bdate&access_token=1db9d62a1db9d62a1db9d62a001dc5e46211db91db9d62a7fe300f1402520f55447d220&v=5.81`
    )
    .then(async function (response) {
      usersData = response.data.response
    })
    .catch(function (error) {
      console.log(error)
    })
  return usersData
}

// Информация по ID пользователей группы
const getMembersIdData = async (totalCount, group_id) => {
  let currCount = 0
  let idsData = []
  const getIds = async () => {
    await axios
      .get(
        `https://api.vk.com/method/groups.getMembers?&group_id=${group_id}&count=1000&offset=${currCount}&access_token=1db9d62a1db9d62a1db9d62a001dc5e46211db91db9d62a7fe300f1402520f55447d220&v=5.81`
      )
      .then(async function (response) {
        currCount = currCount + (response.data.response.items.length || 0)
        idsData = [...idsData, ...response.data.response.items]
        if (currCount < response.data.response.count) {
          await getIds()
        }
      })
      .catch(function (error) {
        console.log(error)
      })
  }
  await getIds()
  return idsData
}

module.exports.getUsersData = getUsersData
module.exports.getGroupData = getGroupData
module.exports.getMembersIdData = getMembersIdData
