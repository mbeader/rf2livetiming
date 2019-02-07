class BestsTracker {
  constructor() {
    this.vehs = new Object();
    this.classes = new Object();
    this.dirty = false;
  }
  
  get bests() {
    if(Object.keys(this.vehs).length > 0)
      return {pb: this.vehs, cb: this.classes};
    else
      return null;
  }
  
  onUpdate(vehs) {
    this.dirty = false;
    for(let i = 0; i < vehs.length; i++) {
      this.addClass(vehs[i].vehclass);
      this.addVeh(vehs[i].drivername, vehs[i].vehclass, vehs[i].vehname);
      this.updateVeh(vehs[i]);
    }
    if(this.dirty)
      return {pb: this.vehs, cb: this.classes};
    else
      return null;
  }
  
  updateVeh(veh) {
    if(veh.currs1 > 0) {
      if(veh.currs1 < this.vehs[veh.drivername][veh.vehclass][veh.vehname].s1) {
        this.vehs[veh.drivername][veh.vehclass][veh.vehname].s1 = veh.currs1;
        this.dirty = true;
        if(veh.currs1 < this.classes[veh.vehclass].s1)
          this.classes[veh.vehclass].s1 = veh.currs1;
      }
      if(veh.currs2 > 0) {
        if(veh.currs2-veh.currs1 < this.vehs[veh.drivername][veh.vehclass][veh.vehname].s2) {
          this.vehs[veh.drivername][veh.vehclass][veh.vehname].s2 = veh.currs2-veh.currs1;
          this.dirty = true;
          if(veh.currs2-veh.currs1 < this.classes[veh.vehclass].s2)
            this.classes[veh.vehclass].s2 = veh.currs2-veh.currs1;
        }
      }
    } else if(veh.lastlap > 0) {
      if(veh.lastlap-veh.lasts2 < this.vehs[veh.drivername][veh.vehclass][veh.vehname].s3) {
        this.vehs[veh.drivername][veh.vehclass][veh.vehname].s3 = veh.lastlap-veh.lasts2;
        this.dirty = true;
        if(veh.lastlap-veh.lasts2 < this.classes[veh.vehclass].s3)
          this.classes[veh.vehclass].s3 = veh.lastlap-veh.lasts2;
      }
      if(veh.lastlap < this.vehs[veh.drivername][veh.vehclass][veh.vehname].t) {
        this.vehs[veh.drivername][veh.vehclass][veh.vehname].t = veh.lastlap;
        this.dirty = true;
        if(veh.lastlap < this.classes[veh.vehclass].t)
          this.classes[veh.vehclass].t = veh.lastlap;
      }
    }
  }
  
  addVeh(driver, vehclass, veh) {
    if(typeof this.vehs[driver] === 'undefined') {
      this.vehs[driver] = new Object();
      if(typeof this.vehs[driver][vehclass] === 'undefined') {
        this.vehs[driver][vehclass] = new Object();
        if(typeof this.vehs[driver][vehclass][veh] === 'undefined')
          this.vehs[driver][vehclass][veh] = this.newBest();
      }
    }
  }
  
  addClass(classname) {
    if(typeof this.classes[classname] === 'undefined') {
      this.classes[classname] = this.newBest();
      
    }
  }
  
  newBest() {
    return {s1: Number.MAX_VALUE, s2: Number.MAX_VALUE, s3: Number.MAX_VALUE, t: Number.MAX_VALUE};
  }
}

module.exports = BestsTracker;