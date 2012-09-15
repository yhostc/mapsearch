// +----------------------------------------------------------------------
// | MapABC JavaScript API
// +----------------------------------------------------------------------
// | Copyright (c) 2010 http://MapABC.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed AutoNavi MapABC
// +----------------------------------------------------------------------
// | Author: yhostc <yhostc@gmail.com>
// +----------------------------------------------------------------------

/**
 +------------------------------------------------------------------------------
 * 类: DragRoute
 * 拖拽导航线路
 +------------------------------------------------------------------------------
 */
DragRoute = AMap.Class({
	_type:"dragroute",
	_obj:false,
	_path:[],	// 原始查询经纬度数组
	_list:[],
	_textCoor:[],
	_textInfo:[],
	_route:[],	// 绘线经纬度数组
	_f:1,		//查询指针
	_event:{},
	
	guid:AMap.Util.guid(),// 定制唯一主键
	
	/**
	 +----------------------------------------------------------
	 * 类初始化方法
	 +----------------------------------------------------------
	 * @param obj : 地图对象
	 * @param path : 查询坐标数组
	 +----------------------------------------------------------
	 */
	initialize:function(obj,path){
		console.log(path);
		this._obj = obj;
		obj.clearOverlays();
		this._path = [];
		this._list = [];
		for(var i=0;i<path.length;i++){
			this._list.push({id:"s"+"_"+AMap.Util.guid(),poi:path[i],o:1});
		}
		this._path = path;
	},
	/**
	 +----------------------------------------------------------
	 * 初始查询方法
	 +----------------------------------------------------------
	 * @param start 起点经纬度对象
	 * @param end   终点经纬度对象
	 +----------------------------------------------------------
	 */
	search:function(){
		var self = this,obj = this._obj,path=[];
		_keywords = this._list;
		console.log(this._list.length);
		$(".dir-list").html('');
		$(".dir-title").hide();
		//添加初始查询点图标
		for(var i=0;i<this._list.length;i++){
			this._event[this._list[i].id] = [];
			(function(p,i){
				var mkr =  new AMap.Marker({
					id:p.id,
					offset:new AMap.Pixel(-10,-34),
					position:p.poi,
					draggable:true,//可拖拽
					icon:"http://maps.gstatic.cn/mapfiles/markers2/marker_green"+String.fromCharCode(65+i)+".png"
				});
				obj.addOverlays(mkr);
				
				var dg = function(e){
					if(self._f){
						var arr=[],lnglat=e.lnglat;
						for(var i=0;i<self._list.length;i++){
							if(self._list[i].id==p.id){
								self._list[i].poi = lnglat;
							}
							arr.push(self._list[i].poi);
						}
						self._reSearch(arr);//重新绘制线路
					}
					self._f = 0;
				};
				obj.bind(mkr,"dragging",dg);
				
				var de = function(){
					self._nearLine();//各查询点靠近轨迹
					var new_path = [];
					for(var i=0;i<self._list.length;i++){
						new_path.push(self._list[i].poi);
					}
					self._reInfo(new_path);
					self._rgeocode(mkr.id,mkr.getPosition(),'list');
					console.log(self._list);
				};
				
				obj.bind(mkr,"dragend",de);
				//缓存事件
				self._event[p.id].push({obj:mkr,t:"dragging",fn:dg});
				self._event[p.id].push({obj:mkr,t:"dragend",fn:de});
			})(this._list[i],i);
			path.push(this._list[i].poi);//记录经纬度数组，用于查询
		}
		this._roadSearch = new AMap.RouteSearch();// 构造查询请求类
		this._roadSearch.getNaviPath(path, function(data){// 查询驾车路线
			self.addRoute(data);
			if(!data.list){return false;}// 数据查询失败,不做处理
			self._route = [];
			// 组织绘制线路径经纬度数组
			for(var i=0;i<data.list.length;i++){
				var l = data.list[i].coor.split(";");
				for(var j=0;j<l.length;j++){
					var m = l[j].split(","); 
					self._route.push(new AMap.LngLat(m[0],m[1]));
				}
			}
			// 构建绘线类
			self._polyline = new AMap.Polyline({
				id:"p"+self.guid,
				path:self._route,
				strokeColor:"#66C",
				strokeOpacity:0.7,
				strokeWeight:5
			});
			//obj.clearOverlaysByType('polyline');
			obj.addOverlays(self._polyline);// 绘线
			obj.setFitView();// 设置视野
			
			// 添加一个隐藏的点标记
			self._point =  new AMap.Marker({
				id:"m"+self.guid,
				offset:new AMap.Pixel(-5,-5),
				position:self._route[0], 
				draggable:true, // 可拖拽
				visible:false, // 初始化隐藏点
				content:"<div title=\"拖动以更改路线\" style=\"width:11px;height:11px;background:url("+AMap.Conf._client+"Images/dd-via.png) 0px 0px no-repeat;\"></div>"
			});
			obj.addOverlays(self._point);
			
			// 绑定事件
			self._bind();
			
			obj.trigger(self,"search",self);
		});
	},
	/**
	 +----------------------------------------------------------
	 * 通过经纬度逆向搜索poi信息
	 +----------------------------------------------------------
	 * @param lnglat 查询需要的经纬度
	 +----------------------------------------------------------
	 */
	 _rgeocode:function(id,path,type){
		 var self = this;
		 $.ajax({type:"POST",dataType:"json",data:{x:path.lng,y:path.lat},url:"c.php/Server/rgeocode",
			 success:function(data){
				 if(type == 'list'){
					 var num = 0;
					 for(var i=0;i<self._list.length;i++){
						 if(self._list[i].id == id){
							 $("input[name=route]").each(function(k) {
								 if(k == num){
									 $(this).val(data.name);
								 }
							});
						 }
						 if(self._list[i].o == 1){
							 num++;
						 }
					 }
				 }
			 }
		 })
	 },
	 /**
	 +----------------------------------------------------------
	 * 搜索途径点
	 +----------------------------------------------------------
	 * @param lnglat 查询需要的经纬度
	 +----------------------------------------------------------
	 */
	 _rdir:function(id,path,type){
		 var self = this;
		 var new_path = [];
		 for(var i=0;i<self._list.length;i++){
		 	 new_path.push(self._list[i].poi);
		 }
		 $.ajax({type:"POST",dataType:"json",data:{x:path.lng,y:path.lat},url:"c.php/Server/rgeocode",
		 	 success:function(data){
				 if(type == 'add'){
				 	 $(".dir-list").append("<p id=\""+id+"\">"+data.name+"<a class=\"widget-remove\" href=\"javascript:void(0)\"></a></p>");
					 $(".dir-list").find(".widget-remove").click(function(e) {
						 self.removeWay($(this).parent().attr('id'));
					 });
				 }
				 if(type == 'edit'){
					 $(".dir-list").find("#"+id+"").html(data.name+"<a class=\"widget-remove\" href=\"javascript:void(0)\"></a>");
					 $(".dir-list").find(".widget-remove").click(function(e) {
						 self.removeWay($(this).parent().attr('id'));
					 });
				 }
			 }
		 })
		 $(".dir-title").show();
		 self._reInfo(new_path);
	 },
	/**
	 +----------------------------------------------------------
	 * 绑定事件
	 +----------------------------------------------------------
	 * @param data 查询结果数据列表
	 +----------------------------------------------------------
	 */
	_bind:function(){
		var self = this, obj = this._obj;
		
		var s = 0, // 点标记是否在线轨迹上移动状态
			d = 0; // 点标记是否在拖拽状态
			
		// 地图鼠标移动事件处理函数
		var fn = function(e){
			//如果不在移动状态,则不做处理
			if(!s){return false;}
			// 计算鼠标位置与线的点及最短距离
			var poi = self._pt2LineDist(self._route,e.lnglat);
			if(poi.dis<10){// 如果距离小于10像素,则移动点标记
				self._point.setPosition(poi);// 调整点标记位置
			}else{// 超出距离,判断是否在拖拽
				s = 0;//重置移动状态
				if(!d){// 没有拖拽
					// 隐藏点标记
					self._point.setVisible(false);
					// 注销鼠标移动事件
					obj.unbind(obj,"mousemove",fn);
				}
			}
		};
		
		// 鼠标移动到线上时, 显示点标记, 并添加鼠标移动事件
		var mv = function(e){
			s = 1;// 定义移动状态
			self._point.setVisible(true);// 显示点标记
			obj.bind(obj,"mousemove",fn);// 注册地图移动事件
		};
		obj.bind(self._polyline,"mousemove",mv);
		self._event["p"+self.guid] = [];
		self._event["p"+self.guid].push({obj:self._polyline,t:"mousemove",fn:mv});
		
		var startPoi,lastList,f=0,gid;
		
		// 点标记拖拽开始
		var ds = function(e){
			d = 1; // 定义拖拽状态
			var arr = [];
			for(var i=0;i<self._list.length;i++){
				arr.push(self._list[i].poi);
			}
			startPoi = self._pt2LineDist(arr,e.lnglat);
			gid = "s"+AMap.Util.guid();//本次拖拽ID
		};
		
		obj.bind(self._point,"dragstart",ds);
		self._event["m"+self.guid] = [];
		self._event["m"+self.guid].push({obj:self._point,t:"dragstart",fn:ds});
		
		// 点标记拖拽过程中
		var dg = function(e){
			d = 1; // 定义拖拽状态
			if(self._f){
				// 在此位置添加一个固定点
				var lnglat = e.lnglat,list=[],arr=[];
				for(var i=0;i<self._list.length;i++){
					list.push(self._list[i]);
					arr.push(self._list[i].poi);
					if(i==startPoi.i){
						list.push({id:gid,poi:new AMap.LngLat(lnglat.lng,lnglat.lat)});
						arr.push(new AMap.LngLat(lnglat.lng,lnglat.lat));
					}
				}
				self._reSearch(arr);
				lastList = list;//记录最后一次更改的POI
			}
			self._f = 0;
		};
		obj.bind(self._point,"dragging",dg);
		self._event["m"+self.guid].push({obj:self._point,t:"dragging",fn:dg});
		
		// 点标记拖拽结束, 添加一个固定的拖拽点
		var de = function(e){
			d = 0;// 重置拖拽状态
			self._list = lastList;
			self._addDragPoi(e.lnglat,gid);
			
			// 隐藏移动点标记
			self._point.setVisible(false);
			// 销毁地图移动事件，减轻压力
			obj.unbind(obj,"mousemove",fn);
			
			self._nearLine();//各查询点靠近轨迹
			self._rdir(gid,e.lnglat,'add');
		};
		obj.bind(self._point,"dragend",de);
		self._event["m"+self.guid].push({obj:self._point,t:"dragend",fn:de});
	},
	/**
	 +----------------------------------------------------------
	 * 重新搜索路线
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param Pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_reSearch:function(path){
		_keywords = path;
		var self = this;
		self._roadSearch.getNaviPath(path, function(data2){
			//console.log(data2);
			if(!data2.list){return false;}// 数据查询失败
			var list2 = data2.list,route2=[];
			// 组织绘线路径经纬度数组
			//var route = [];// 临时数组，用于组织经纬度数组
			for(var i=0;i<list2.length;i++){
				var l = list2[i].coor.split(";");
				for(var j=0;j<l.length;j++){
					var m = l[j].split(","); 
					route2.push(new AMap.LngLat(m[0],m[1]));
				}
			}
			//console.log(route2);
			self._route = route2;
			self._polyline.setPath(route2);
			self._f = 1;
			self._obj.trigger(self,"search",self);
		});
		
	},
	/**
	 +----------------------------------------------------------
	 * 重新生成文字导航
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param Pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_reInfo:function(path){
		var self = this;
		self._roadSearch.getNaviPath(path, function(data3){
			self.addRoute(data3);
		});
	},
	/**
	 +----------------------------------------------------------
	 * 拖拽结束后添加固定点
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param Pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_addDragPoi:function(lnglat,gid){
		var obj = this._obj,self = this;
		var c = document.createElement("div");
		c.title = "拖动以更改路线";
		c.style.cssText = "width:11px;height:11px;background:url("+AMap.Conf._client+"Images/dd-via.png) 0px 0px no-repeat;";
		var d = document.createElement("img");
		d.tilte = "删除此途经点";
		d.style.cssText = "display:none;position:absolute;left:11px;top:-1px;";
		d.src = obj._client+"Images/close.gif";
		d.onclick = function(){
			self.removeWay(gid);
		}
		c.appendChild(d);
		
		// 将当前位置点插入查询数组中
		var mkr = new AMap.Marker({
			id:gid,
			offset:new AMap.Pixel(-5,-5),
			position:lnglat,
			draggable:true, // 可拖拽
			zIndex:100,
			content:c
		});
		obj.addOverlays(mkr);
		
		//显示删除标志
		var mo = function(e){
			d.style.display = "block";
		};
		obj.bind(mkr,"mouseover",mo);
		//隐藏删除标志
		var mu = function(e){
			d.style.display = "none";
		};
		obj.bind(mkr,"mouseout",mu);
		var dg = function(e){
			if(self._f){
				var arr=[],lnglat=e.lnglat;
				for(var i=0;i<self._list.length;i++){
					if(self._list[i].id==gid){
						self._list[i].poi = lnglat;
					}
					arr.push(self._list[i].poi);
				}
				self._reSearch(arr);//重新绘制线路
			}
			self._f = 0;
		};
		obj.bind(mkr,"dragging",dg);
		var de = function(e){
			self._nearLine();//各查询点靠近轨迹
			self._rdir(gid,e.lnglat,'edit');
		};
		obj.bind(mkr,"dragend",de);
		
		self._event[gid] = [];
		self._event[gid].push({obj:mkr,t:"dragging",fn:dg});
		self._event[gid].push({obj:mkr,t:"dragend",fn:de});
		self._event[gid].push({obj:mkr,t:"mouseover",fn:mo});
		self._event[gid].push({obj:mkr,t:"mouseout",fn:mu});
		
		obj.trigger(this,"addway",this);
	},
	/**
	 +----------------------------------------------------------
	 * 使所有必经点和途径点靠近到轨迹上去
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param Pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_nearLine:function(){//
		var obj = this._obj;
		//console.log(this._list);
		for(var i=0;i<this._list.length;i++){
			var poi = this._pt2LineDist(this._route,this._list[i].poi);
			var ov = obj.getOverlays(this._list[i].id);
			ov.setPosition(poi);
		}
	},
	/**
	 +----------------------------------------------------------
	 * 求点到线集合中最短距离
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param Pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_pt2LineDist:function(line,Pt) {
		var a={dis:Number.MAX_VALUE};
		for (var i=0;i<line.length-1;i++) {
			var arr = [line[i],line[i+1]];
			var b = this._pt2LineSegmentDist(arr,Pt);
			if (b.dis < a.dis) {
				a = {lng:b.lng,lat:b.lat,dis:b.dis,i:i,_type:"lnglat"};
			}
		}
		//计算像素距离
		a.dis = Math.round(this._obj.getDistance(Pt,new AMap.LngLat(a.lng,a.lat))/this._obj.getResolution());
		return a;
	},
	/**
	 +----------------------------------------------------------
	 * 求点到线最短距离点及距离
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_pt2LineSegmentDist:function(line,pt) {
		var x = 0,y = 0;
		var dX = line[1].lng - line[0].lng,dY = line[1].lat - line[0].lat;
		var dR = -(line[0].lat - pt.lat) * dY - (line[0].lng - pt.lng) * dX;
		var dL;
		if (dR <= 0) {
			x = line[0].lng;
			y = line[0].lat;
		} else if (dR >= (dL = dX * dX + dY * dY)) {
			x = line[1].lng;
			y = line[1].lat;
		} else {
			x = line[0].lng + dR * dX / dL;
			y = line[0].lat + dR * dY / dL;
		}
		//返回实地距离
		return {lng:x,lat:y,dis:Math.pow(pt.lng-x,2) + Math.pow(pt.lat - y,2)}
	},
	/**
	 +----------------------------------------------------------
	 * 删除其中一个途径点
	 +----------------------------------------------------------
	 * @param id 途经点ID
	 +----------------------------------------------------------
	 */
	removeWay:function(id){
		var arr=[],obj=this._obj,self=this;
		for(var i=0;i<this._list.length;i++){
			if(this._list[i].id == id){//删除途径点
				//删除事件
				var a = self._event[id];
				for(var j=0;j<a.length;j++){
					obj.unbind(a[j].obj,a[j].t,a[j].fn);
				}
				this._event[id] = null;
				delete this._event[id];
				obj.removeOverlays(id);
				this._list.splice(i,1);
				i--;
			}else{
				arr.push(this._list[i].poi);
			}
		}
		$(".dir-list").find("#"+id+"").remove();
		if($(".dir-list").html() == ""){
			$(".dir-title").hide();
		}
		this._reSearch(arr);//重绘
		this._reInfo(arr);//重新生成导航文字
	},
	/**
	 +----------------------------------------------------------
	 * 获取所有途径点
	 +----------------------------------------------------------
	 */
	getWays:function(){
		var arr=[];
		for(var i=0;i<this._list.length;i++){
			if(!this._list[i].o){
				arr.push(this._list[i]);
			}
		}
		return arr;
	},
	/**
	 +----------------------------------------------------------
	 * 获取当前轨迹线路
	 +----------------------------------------------------------
	 */
	getRoute:function(){
		return this._route;
	},
	
	/**
	 +----------------------------------------------------------
	 * 销毁所有注册的事件和覆盖物
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	destory:function(){
		var obj = this._obj;
		//销毁所有事件
		for(var i in this._event){
			var a = this._event[i];
			for(var j=0;j<a.length;j++){
				obj.unbind(a[j].obj,a[j].t,a[j].fn);
			}
			this._event[i] = null;
			delete this._event[i];
			obj.removeOverlays(i);
		}
		//清空所有途径点
		for(var i=0;i<this._list.length;i++){
			if(!this._list[i].o){
				this._list.splice(i,1);
				i--;
			}
		}
		//清空隐藏的POI
		this._point = null;
		delete this._point;
		//清空原线路
		this._polyline = null;
		delete this._polyline;
	},
	/**
	+----------------------------------------------------------
	* 格式化返回的json数据
	+----------------------------------------------------------
	* @param data 查询得到的导航信息
	+----------------------------------------------------------
	*/
	addRoute:function(data){
		var obj = this._obj,self = this;
		if(!data){return false;}
		var list = data.list;
		self._textCoor = [];
		self._textInfo = [];
		var a = [];
		for(var i in data.list){
			self._textCoor.push(data.list[i].coor);
			self._textInfo.push(data.list[i].roadName);
			spot = data.list[i];
			var index = parseInt(i)+1;
			a.push('<p id=\"'+i+'\" class=\"textInfo\">');
			a.push(index+'.'+spot.textInfo);
			a.push("</p>");
		}
		$('.route-result').html(a.join(""));
		$('.textInfo').hover(function(e){
			var id = $(this).attr('id');
			var arr = [];
			coor = self._textCoor[id].split(';');
			for(var i=0;i<coor.length;i++){
				if(i == 0){
					tlnglat = coor[i].split(',');
					lng = tlnglat[0];
					lat = tlnglat[1];
				}
				lnglat = coor[i].split(',');
				arr.push(new AMap.LngLat(lnglat[0],lnglat[1]));
			}
			var tm = document.createElement("div");
			tm.className = "marker";
			var tn = document.createElement("div");
			var l = document.createElement("img");
			l.src = "./images/rock.png";
			tn.innerHTML = self._textInfo[id];
			tm.appendChild(tn);
			tm.appendChild(l);
			var marker = new AMap.Marker({
				id:"navimarker",
				zIndex:10,
				position:new AMap.LngLat(lng,lat),//基点位置
				offset:new AMap.Pixel(-10,-35),//相对于基点的偏移位置
				content:tm //自定义覆盖物内容
			});
			var textline = new AMap.Polyline({
				id:"textline",
				path:arr,
				strokeColor:"#0CF",
				strokeOpacity:0.8,
				strokeWeight:3
			});
			obj.addOverlays(marker);
			obj.addOverlays(textline);
		},function(e){
			obj.removeOverlays('navimarker');
			obj.removeOverlays('textline');
		});
	}
});
