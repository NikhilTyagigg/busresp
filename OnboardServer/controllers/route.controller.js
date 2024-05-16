const models = require("../models");

const logger = require("../helper/logger");
// const app = require('../app')

const moment = require("moment");
const mqtt = require("../helper/mqtt");

const {
  NotAuthorizedError,
  ApplicationError,
  UserError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  InternalError,
} = require("../helper/errors");
const { Op } = require("sequelize");
const { MQTT_DATA_SOURCES } = require("../helper/constant");

const Vehicle = models.Vehicle;
const VehicleType = models.VehicleType;
const QueryLogs = models.QueryLog;
const Route = models.Route;
const VehicleRouteMap = models.VehicleRouteDriverMap;

var main = {};

main.configRoutes = async () => {
  try {
    let sampleData = {
      OnBoard: "DL9CAB0975",
      "Bus Module ID": 753,
      "Route No": "1243",
      source: "web app",
    };
    mqtt.publishToMqtt(sampleData);
    return true;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.addVehicle = async (data) => {
  //this will be used for adding/updating and deleting a vehicle
  logger.info("Adding/updating vehicle vehicle::" + JSON.stringify(data));
  try {
    let vehicle = null;
    if (!data.vehicleModule || !data.vehicleNo || !data.vehicleType) {
      throw new UserError("Please enter all the valid parameters!!");
    }
    data["vehicleNo"] = data.vehicleNo.trim().toUpperCase();
    data["vehicleModule"] = data.vehicleModule.trim().toUpperCase();
    if (data.vehicleId) {
      vehicle = await Vehicle.findOne({
        where: {
          vehicleId: data.vehicleId,
        },
      });
      if (!vehicle) {
        logger.error("No vehicle found!!");
        throw new UserError("No vehicle found!!");
      }
      if (data.vehicleNo != vehicle.vehicleNo.trim().toUpperCase()) {
        let oldVehicle = await Vehicle.findOne({
          where: {
            vehicleNo: data.vehicleNo,
          },
        });
        if (oldVehicle && oldVehicle.isActive) {
          throw new ConflictError("Vehicle is already added!!");
        } else if (oldVehicle) {
          await vehicle.update({
            isActive: false,
          });
          vehicle = oldVehicle;
        }
      } else if (
        data.vehicleModule != vehicle.vehicleModule.trim().toUpperCase()
      ) {
        let oldVehicle = await Vehicle.findOne({
          where: {
            vehicleModule: data.vehicleModule,
          },
        });
        if (oldVehicle && oldVehicle.isActive) {
          {
            throw new ConflictError(
              "Module is already mapped to vehicle No:: " + oldVehicle.vehicleNo
            );
          }
        } else if (oldVehicle) {
          await vehicle.update({
            isActive: false,
          });
          vehicle = oldVehicle;
        }
      }

      await vehicle.update({
        vehicleNo: data.vehicleNo,
        vehicleModule: data.vehicleModule || "",
        vehicleType: data.vehicleType,
        isActive: data.isActive,
      });
    } else {
      vehicle = await Vehicle.findOne({
        where: {
          [Op.or]: {
            vehicleNo: data.vehicleNo,
            vehicleModule: data.vehicleModule,
          },
        },
      });

      if (vehicle && vehicle.isActive) {
        if (data.vehicleModule == vehicle.vehicleModule) {
          throw new ConflictError(
            "Module is already mapped to vehicle No:: " + vehicle.vehicleNo
          );
        }
        logger.error("Vechile number already exists!!");
        throw new UserError("Vehicle Number already registered!!");
      }

      if (vehicle) {
        await vehicle.update({
          vehicleModule: data.vehicleModule,
          isActive: true,
          vehicleType: data.vehicleType,
        });
      } else {
        vehicle = await Vehicle.create({
          vehicleNo: data.vehicleNo,
          vehicleModule: data.vehicleModule,
          isActive: true,
          vehicleType: data.vehicleType,
        });
      }
    }

    let vehicles = await Vehicle.findAndCountAll({
      order: [["updatedAt", "DESC"]],
      where: {
        isActive: true,
      },
      include: [
        {
          model: VehicleType,
        },
      ],
    });
    return vehicles;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.getVehicles = async (filter) => {
  logger.info("Get vehicles");
  try {
    let vehicles = await Vehicle.findAndCountAll({
      order: [["updatedAt", "DESC"]],
      where: {
        isActive: true,
      },
      include: [
        {
          model: VehicleType, // Specify the association between Vehicle and VehicleType
          as: "VehicleType", // Assuming the association alias is 'VehicleType'
        },
      ],
    });

    let vehicleType = await VehicleType.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    return { vehicles, vehicleType };
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.addRoute = async (data) => {
  console.log(JSON.stringify(data));

  //this will be used for adding/updating and deleting a vehicle
  logger.info("Adding/updating route details::" + JSON.stringify(data));
  try {
    let route = null;
    if (
      !data.routeNo ||
      !data.startPoint ||
      !data.endPoint ||
      !data.startTime ||
      !data.endTime ||
      !data.depotname ||
      !data.frequency
    ) {
      throw new UserError("Please enter all the valid parameters!!");
    }
    let routeNo = data.routeNo;
    if (routeNo.length < 6) {
      while (routeNo.length < 6) {
        routeNo = "0" + routeNo;
      }
    }
    if (data.routeId) {
      route = await Route.findOne({
        where: {
          routeId: data.routeId,
        },
      });
      if (!route) {
        logger.error("No route found!!");
        throw new UserError("No route found!!");
      }
      if (data.routeNo != route.routeNo) {
        let oldRoute = await Route.findOne({
          where: {
            routeNo: routeNo,
          },
        });
        if (oldRoute && oldRoute.isActive) {
          throw new ConflictError("Route number is already added!!");
        } else if (oldRoute) {
          await route.update({
            isActive: false,
          });
          route = oldRoute;
        }
      }
      await route.update({
        routeNo: routeNo,
        startPoint: data.startPoint,
        endPoint: data.endPoint,
        startTime: data.startTime,
        endTime: data.endTime,
        depotname: data.depotname,
        frequency: data.frequency,
        intermediateStops: data.intermediateStops || "",
        isActive: data.isActive,
      });
    } else {
      route = await Route.findOne({
        where: {
          routeNo: routeNo,
          // isActive: true
        },
      });
      if (route && route.isActive) {
        logger.error("Route Number already exits!!");
        throw new UserError("Route Number already exits!!");
      }
      if (route) {
        await route.update({
          startPoint: data.startPoint,
          endPoint: data.endPoint,
          startTime: data.startTime,
          endTime: data.endTime,
          depotname: data.depotname,
          frequency: data.frequency,
          intermediateStops: data.intermediateStops || "",
          isActive: true,
        });
      } else {
        route = await Route.create({
          routeNo: routeNo,
          startPoint: data.startPoint,
          endPoint: data.endPoint,
          startTime: data.startTime,
          endTime: data.endTime,
          depotname: data.depotname,
          frequency: data.frequency,
          intermediateStops: data.intermediateStops || "",
          isActive: true,
        });
      }
    }

    let routes = await Route.findAndCountAll({
      order: [["updatedAt", "DESC"]],
      where: {
        isActive: true,
      },
    });
    return routes;
  } catch (err) {
    //logger.error(err);
    console.log(err);
    throw new InternalError(err);
  }
};

main.getRoutes = async (filter) => {
  logger.info("Get vehicles");
  try {
    let routes = await Route.findAndCountAll({
      order: [["updatedAt", "DESC"]],
      where: {
        isActive: true,
      },
    });
    return routes;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.getQueryLogs = async (filter) => {
  logger.info("Get vehicles");
  try {
    let logs = await QueryLogs.findAndCountAll({
      // where : {
      //     requestedAt:{
      //         [Op.gte] : moment().format('MM/DD/YYYY')
      //     }
      // },
      order: [["updatedAt", "DESC"]],
      limit: 500,
    });
    return logs;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.getMasterData = async () => {
  logger.info("Getting master data");
  try {
    let vehicles = await Vehicle.findAll({
      where: {
        isActive: true,
      },
      attributes: ["vehicleId", "vehicleNo"],
    });

    let routes = await Route.findAll({
      where: {
        isActive: true,
      },
      attributes: ["routeId", "routeNo"],
    });

    return { vehicles, routes };
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.getRouteVehicleMap = async (filter) => {
  logger.info("Get vehicles");
  try {
    let routeConfigList = await VehicleRouteMap.findAndCountAll({
      where: {
        isActive: true,
      },
      order: [["updatedAt", "DESC"]],
      include: [
        {
          model: Vehicle,
        },
        {
          model: Route,
        },
      ],
    });
    return routeConfigList;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.addVehicleRouteMap = async (data) => {
  //this will be used for adding/updating and deleting a vehicle
  logger.info("Adding/updating route details::" + JSON.stringify(data));
  try {
    let route = null;
    let vehicle = await Vehicle.findOne({
      where: {
        vehicleId: data.vehicleId,
      },
    });
    if (data.id) {
      route = await VehicleRouteMap.findOne({
        where: {
          vehicleRouteDriverMapId: data.id,
        },
      });
      if (!route) {
        logger.error("No mapping found!!");
        throw new UserError("No mapping found!!");
      }
      if (!route.isVerified || data.retry) {
        mqtt.publishToMqtt({
          "Bus Id": vehicle.vehicleModule,
          "Route No": data.routeNo,
        });
        await route.update({
          isActive: true,
        });
      }
    } else {
      if (!data.routeId || !data.vehicleId || !data.date) {
        throw new UserError("Please enter all the valid parameters!!");
      }
      route = await VehicleRouteMap.create({
        routeId: data.routeId,
        vehicleId: data.vehicleId,
        dateAndTime: data.date,
        driver: data.driver || "",
        isActive: true,
      });
      mqtt.publishToMqtt({
        "Bus Id": vehicle.vehicleModule,
        "Route No": data.routeNo,
      });
    }

    let routes = await VehicleRouteMap.findAndCountAll({
      where: {
        isActive: true,
      },
      order: [["dateAndTime", "DESC"]],
      include: [
        {
          model: Vehicle,
        },
        {
          model: Route,
        },
      ],
    });
    return routes;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.addMultipleRoute = async (data = []) => {
  //this will be used for adding/updating and deleting a vehicle
  logger.info("Adding/updating route details::" + JSON.stringify(data));
  try {
    if (!data || data.length == 0) {
      logger.error("No route data provided!!");
      throw new UserError("No route data provided!!");
    }
    let isDuplicate = false;
    let routesData = [];
    data &&
      data.map((d) => {
        if (!d[0] || d.length < 3) {
          throw new ConflictError(
            "Invalid entry present in the sheet, please check and upload again!!"
          );
        }
        if (d[0].length > 6) {
          throw new ConflictError(
            "Route Number cannot be greater than 6 digits, please check and upload again!!"
          );
        }

        let regex = new RegExp("^[a-zA-Z0-9_]+$");
        if (!regex.test(d[0])) {
          throw new ConflictError(
            "Invalid route no" +
              d[0] +
              "Only alphanumeric route number data is allowed, please check and upload again!!"
          );
        }
        let rNo = d[0];
        rNo = rNo.toString();
        while (rNo.length < 6) {
          rNo = "0" + rNo;
        }

        if (routesData.find((r) => r.routeNo == d[0])) {
          isDuplicate = true;
          return false;
        }
        routesData.push({
          routeNo: rNo.toUpperCase(),
          startPoint: d[1],
          endPoint: d[2],
          depotname: d[3],
          startTime: d[4],
          endTime: d[5],
          frequency: d[6],
          intermediateStops: d.length > 3 ? d[3] : "",
          isActive: true,
        });
      });
    if (isDuplicate) {
      logger.error(
        "Duplicate entries for same route number exists. Please maintain single entry for each route No."
      );
      throw new ConflictError(
        "Duplicate entries for same route number exists. Please maintain single entry for each route No."
      );
    }
    await Route.bulkCreate(routesData, {
      updateOnDuplicate: [
        "startPoint",
        "endPoint",
        "startTime",
        "endTime",
        "frequency",
        "intermediateStops",
        "isActive",
      ],
    });

    let routes = await Route.findAndCountAll({
      order: [["updatedAt", "DESC"]],
      where: {
        isActive: true,
      },
      // attributes : ['routeId', 'routeNo']
    });
    return routes;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

main.addMultipleVehicles = async (data = []) => {
  //this will be used for adding/updating and deleting a vehicle
  logger.info(
    "Adding/updating vehicle details details::" + JSON.stringify(data)
  );
  try {
    if (!data || data.length == 0) {
      logger.error("No vehicle data provided!!");
      throw new UserError("No vehicle data provided!!");
    }
    let isDuplicate = false;
    let vehiclesData = [];
    data &&
      data.map((d) => {
        if (vehiclesData.find((r) => r.vehicleNo == d[0])) {
          isDuplicate = true;
          return false;
        }
        vehiclesData.push({
          vehicleNo: d[0],
          vehicleModule: d.length == 3 ? d[1] : "", //if vehicle module is not provided then it will be empty
          vehicleType: 1,
          isActive: true,
        });
      });
    if (isDuplicate) {
      logger.error(
        "Duplicate entries for same vehicle number exists. Please maintain single entry for each vehicle No."
      );
      throw new ConflictError(
        "Duplicate entries for same vehicle number exists. Please maintain single entry for each vehicle No."
      );
    }
    await Vehicle.bulkCreate(vehiclesData, {
      updateOnDuplicate: ["vehicleModule", "isActive"],
      logging: console.log,
    });

    let vehicles = await Vehicle.findAndCountAll({
      order: [["updatedAt", "DESC"]],
      where: {
        isActive: true,
      },
      include: [
        {
          model: VehicleType,
        },
      ],
    });
    return vehicles;
  } catch (err) {
    logger.error(err);
    throw new InternalError(err);
  }
};

module.exports = main;
