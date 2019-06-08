import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  dishList: FormArray;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  isEditable = true;
  options: string[] = ['breakfast', 'lunch', 'dinner'];
  resturants: any;
  dishes: string[];
  isLinear = true;
  thirdFormGroup: FormGroup;
  selectedDishes: string[] = [];
  responseData: any;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.firstFormGroup = this.fb.group({
      firstCtrl: ['', Validators.required],
      secondCtrl: [
        '',
        [Validators.required, Validators.max(10), Validators.min(1)]
      ]
    });
    this.secondFormGroup = this.fb.group({
      rest: ['', Validators.required]
    });
    this.thirdFormGroup = this.fb.group({
      dishes: this.fb.array([this.createDish()])
    });
    this.dishList = this.thirdFormGroup.get('dishes') as FormArray;
  }
  createDish(): FormGroup {
    return this.fb.group({
      dish: ['', Validators.required],
      serving: [1, [Validators.required, Validators.max(10), Validators.min(1)]]
    });
  }
  get dishFormGroup() {
    return this.thirdFormGroup.get('dishes') as FormArray;
  }
  getContentJSON() {
    return this.http.get('assets/dishes.json');
  }
  addDish() {
    this.selectedDishes = this.thirdFormGroup.value.dishes.map(e => e.dish);

    this.dishList.controls.forEach((e: any) =>
      e.controls.dish.disable({ onlySelf: true })
    );
    this.dishList.push(this.createDish());
  }

  reviewProfile(stepper: MatStepper) {
    const totalServing = this.thirdFormGroup.value.dishes.reduce(
      (a, b) => a + (b.serving || 0),
      0
    );
    if (totalServing < this.firstFormGroup.controls.secondCtrl.value) {
      return this.snack.open(
        `Dish count should be greater or equale to ${
          this.firstFormGroup.controls.secondCtrl.value
        }`,
        'close',
        {
          duration: 2000,
          verticalPosition: 'top'
        }
      );
    } else {
      this.responseData = {
        meal: this.firstFormGroup.controls.firstCtrl.value,
        resturant: this.secondFormGroup.controls.rest.value,
        dishes: this.thirdFormGroup.value.dishes,
        personCount: this.firstFormGroup.controls.secondCtrl.value
      };
      stepper.next();
    }
  }

  getResturant() {
    const meal = this.firstFormGroup.controls.firstCtrl.value;
    this.getContentJSON().subscribe((response: any) => {
      this.resturants = response.dishes
        .filter(e => e.availableMeals.includes(meal))
        .map(r => r.restaurant);
      this.resturants = new Set([...this.resturants]);
    });
  }

  getDishes() {
    const resturant = this.secondFormGroup.controls.rest.value;
    this.getContentJSON().subscribe(
      (response: any) =>
        (this.dishes = response.dishes
          .filter(e => e.restaurant === resturant)
          .map(d => d.name))
    );
  }
  submit(stepper: MatStepper) {
    const items = [this.responseData];
    const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    let csv: any = items.map(row =>
      header
        .map(fieldName => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    const link = document.createElement('a');
    link.id = 'lnkDwnldLnk';
    document.body.appendChild(link);
    const blob = new Blob([csv], { type: 'text/csv' });
    this.snack.open(`Order Saved Successfully`, 'close', {
      duration: 2000,
      verticalPosition: 'top'
    });
    this.http.post(environment.host, {data: this.responseData}).subscribe(response => {
      saveAs(blob, 'order.csv');
      stepper.reset();
    });
  }
}
