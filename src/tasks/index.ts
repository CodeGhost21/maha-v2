import nconf from 'nconf'
import Agenda from 'agenda'

export const agenda = new Agenda({ db: { address: nconf.get('MONGODB_URI') } })

export const processTasks = async function () {
  // IIFE to give access to async/await
  await agenda.start()
}
