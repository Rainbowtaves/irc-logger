const {PrismaClient, MessageType} = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs/promises')
const yargs = require('yargs')
yargs.array('ignore')
const args = yargs.argv
const path = require('path')
const deleteDuplicates = prisma.$queryRaw`
     DELETE FROM "Message" a USING (
      SELECT MIN(ctid) as ctid, content, created_at
        FROM "Message"
        GROUP BY content, created_at HAVING COUNT(*) > 1
      ) b
      WHERE a.content = b.content AND a.created_at = b.created_at
      AND a.ctid <> b.ctid;`

function appendError(filePath) {
    fs.appendFile('./errors.txt', filePath)
}
let estimatedTime = Date.now()
let rowsCount = 0
async function init() {
    await prisma.$connect()
    const folderPath = await fs.realpath(args.path)
    for (let folder of (await fs.readdir(folderPath, {withFileTypes: true}))) {
        if (folder.isDirectory() && !args.ignore?.includes(folder.name.substring(1))) {
            let folderTime = Date.now()
            const logs = await fs.readdir(path.join(folderPath, folder.name))
            for (let log of logs) {
                if (log.endsWith('.log')) {
                    let logTime = Date.now()
                    const file = await fs.readFile(path.join(folderPath, folder.name, log), {encoding: 'utf-8'})
                    let dataArr = []
                    for (let line of file.split('\n')) {
                        let splits = line.split(" ")
                        let date = new Date(log.split(".")[0]+"T"+splits.shift()+"Z"),
                            username,
                            content,
                            type = MessageType.MESSAGE,
                            usertype = null
                        if (isNaN(date.getTime())) continue
                        if (splits[0] === '') splits.shift()
                        if (splits[0].indexOf('-!-') === 0 && splits[1].startsWith('mode/')) {
                            splits.shift()
                            username = splits.pop()
                            content = splits.join(' ')
                            type = MessageType.MODE
                        } else if (splits[0].indexOf('<') === 0) {
                            const joined = splits.join(" ")
                            username = joined.substring(1, joined.indexOf('>'))
                            usertype = username[0] === " " ? null : username[0]
                            username = username.slice(1)
                            content = joined.substring(joined.indexOf('>')+2)
                        } else if (splits[0].indexOf('*') === 0) {
                            username = splits[1]
                            content = splits.splice(2).join(" ")
                            type = MessageType.ACTION
                        }
                        if(!content || !username) continue
                        dataArr.push(prisma.message.create({
                            data: {
                                content: content,
                                type: type,
                                usermode: usertype,
                                created_at: date,
                                user: {
                                    connectOrCreate: {
                                        create: {
                                            username: username
                                        },
                                        where: {
                                            username: username
                                        }
                                    }
                                },
                                channel: {
                                    connectOrCreate: {
                                        create: {
                                            name: folder.name
                                        },
                                        where: {
                                            name: folder.name
                                        }
                                    }
                                }
                            }
                        }))
                    }
                    await prisma.$transaction(dataArr)
                        .then(e => {
                            console.log(new Date(), `[FILE][${folder.name}/${log}] Parsed ${folder.name}/${log} in ${Date.now()-logTime}ms, pushed ${e.length} rows`)
                            rowsCount += e.length
                        })
                        .catch(err => {
                            console.error(new Date(), `[DATABASE][${folder.name}/${log}] An Error occurred`)
                            console.error(err)
                            appendError(path.join(folder.name, log))
                        })

                }
            }
            console.log(new Date(), `[FOLDER][${folder.name}] Fully parsed ${folder.name} in ${Date.now()-folderTime}ms`)
        }
    }

}

init().finally(() => {
    prisma.$disconnect()
    console.log(new Date(), `[COMPLETED] Completed in ${(Date.now()-estimatedTime)}. Pushed ${rowsCount} rows`)
})