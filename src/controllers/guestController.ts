import Guest from '../models/guestModel';
import * as factory from './handlerFactory';

const getAllGuests = factory.getAll(Guest);
const getGuest = factory.getOne(Guest);
const createGuest = factory.createOne(Guest);
const updateGuest = factory.updateOne(Guest);
const deleteGuest = factory.deleteOne(Guest);

export default {
  getAllGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
};
